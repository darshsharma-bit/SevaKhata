/**
 * Smoke test: shared rules + the JSON API, with no extra dependencies.
 *   npm test
 * It starts server.js against a temporary COPY of data/, so your real seed files are untouched.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const V = require('../js/validation.js');
const R = require('../js/records.js');

let passed = 0;
const ok = (name, fn) => Promise.resolve().then(fn).then(() => { passed++; console.log('  ✓ ' + name); }, (e) => { console.error('  ✗ ' + name + '\n    ' + e.message); process.exitCode = 1; });

(async () => {
  console.log('Validation rules');
  await ok('Indian phone numbers', () => {
    ['9810012345', '6000000000'].forEach((p) => assert.strictEqual(V.validateField(V.SCHEMAS.worker, 'phone', p, {}), null));
    ['5810012345', '98100123', '98100123456', 'abcdefghij'].forEach((p) => assert.ok(V.validateField(V.SCHEMAS.worker, 'phone', p, {})));
  });
  await ok('ID formats by type', () => {
    const chk = (type, v) => V.validateField(V.SCHEMAS.workerForm, 'idNumber', v, { idType: type });
    assert.strictEqual(chk('aadhaar', '234567890123'), null);
    assert.ok(chk('aadhaar', '123456789012'));          // cannot start with 1
    assert.strictEqual(chk('pan', 'ABCDE1234F'), null);
    assert.ok(chk('pan', 'abcde'));
  });
  await ok('wage must be positive and in range', () => {
    const s = V.SCHEMAS.workerForm, all = { rateType: 'daily' };
    assert.ok(V.validateField(s, 'rate', '0', all)); assert.ok(V.validateField(s, 'rate', '-5', all)); assert.ok(V.validateField(s, 'rate', '50', all));
    assert.strictEqual(V.validateField(s, 'rate', '500', all), null);
    assert.strictEqual(V.validateField(s, 'rate', '14000', { rateType: 'monthly' }), null);
  });

  console.log('Ledger rules');
  await ok('Only CONFIRMED entries reach the balance', () => {
    const b = R.balance([
      { type: 'attendance', amount: 4000, status: 'confirmed' }, { type: 'advance', amount: 1000, status: 'confirmed' },
      { type: 'attendance', amount: 500, status: 'pending' }, { type: 'attendance', amount: 300, status: 'pending' },
      { type: 'payment', amount: 2000, status: 'disputed' }]);
    assert.strictEqual(b.confirmed, 3000); assert.strictEqual(b.pending, 800); assert.strictEqual(b.disputed, -2000);
  });
  await ok('state machine: pending -> confirm / dispute, confirmed is final', () => {
    const e = { id: 'x', status: 'pending', amount: 500, type: 'attendance' };
    assert.strictEqual(R.applyLedgerAction(e, { action: 'confirm', actor: 'employer' }).error.status, 403);
    assert.strictEqual(R.applyLedgerAction(e, { action: 'dispute', actor: 'helper', reason: 'short' }).error.status, 400);
    const d = R.applyLedgerAction(e, { action: 'dispute', actor: 'helper', reason: 'I worked that day, not on leave.' }).entry;
    assert.strictEqual(d.status, 'disputed');
    const c = R.applyLedgerAction(e, { action: 'confirm', actor: 'helper' }).entry;
    assert.strictEqual(c.status, 'confirmed');
    assert.strictEqual(R.applyLedgerAction(c, { action: 'dispute', actor: 'helper', reason: 'changed my mind now' }).error.status, 409);
    const r = R.applyLedgerAction(d, { action: 'resubmit', actor: 'employer', amount: 450 }).entry;
    assert.strictEqual(r.status, 'pending'); assert.strictEqual(r.amount, 450);
  });

  console.log('API (temporary data copy)');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sevakhata-'));
  fs.readdirSync(path.join(__dirname, '..', 'data'))
    .filter((f) => f.endsWith('.json'))
    .forEach((f) => fs.copyFileSync(path.join(__dirname, '..', 'data', f), path.join(tmp, f)));
  process.env.SEVAKHATA_DATA_DIR = tmp;
  const app = require('../server.js');
  const server = app.listen(0);
  const base = 'http://127.0.0.1:' + server.address().port;
  const call = async (method, p, body) => { const r = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };

  await ok('GET returns seeded records', async () => { const r = await call('GET', '/api/workers'); assert.strictEqual(r.status, 200); assert.ok(r.body.length >= 3); });
  await ok('invalid POST is rejected with field errors', async () => { const r = await call('POST', '/api/workers', { name: 'x', phone: '12' }); assert.strictEqual(r.status, 400); assert.ok(r.body.errors.phone); });
  await ok('valid worker is appended to workers.json (ID stored as last 4 only)', async () => {
    const r = await call('POST', '/api/workers', { name: 'Test Helper', phone: '9876543210', category: 'maid', skills: 'Cleaning, Cooking', experienceYears: 2, location: 'Noida', rateType: 'daily', rate: 400, idType: 'aadhaar', idLast4: '0123' });
    assert.strictEqual(r.status, 201); assert.strictEqual(r.body.verified, false);
    const onDisk = JSON.parse(fs.readFileSync(path.join(tmp, 'workers.json'), 'utf8'));
    assert.ok(onDisk.some((w) => w.id === r.body.id && w.idLast4 === '0123' && !('idNumber' in w)));
  });
  await ok('new ledger entry always starts pending, then helper confirms', async () => {
    const created = await call('POST', '/api/ledger', { workerId: 'w-1001', type: 'attendance', attendanceKind: 'full', days: 1, date: '2026-08-15', amount: 500, status: 'confirmed' });
    assert.strictEqual(created.status, 201); assert.strictEqual(created.body.status, 'pending');   // client-supplied status is ignored
    assert.strictEqual((await call('PATCH', '/api/ledger/' + created.body.id, { action: 'confirm', actor: 'employer' })).status, 403);
    const done = await call('PATCH', '/api/ledger/' + created.body.id, { action: 'confirm', actor: 'helper' });
    assert.strictEqual(done.body.status, 'confirmed');
  });
  await ok('feedback + bookings persist', async () => {
    assert.strictEqual((await call('POST', '/api/feedback', { kind: 'support', name: 'Asha Rao', email: 'asha@example.com', subject: 'Cannot log in', message: 'I cannot open my ledger on my phone since yesterday.' })).status, 201);
    assert.strictEqual((await call('POST', '/api/bookings', { requestKind: 'new', householdName: 'Rao Household', contactName: 'Asha Rao', phone: '9812345678', category: 'cook', location: 'Pune', startDate: '2026-09-01', schedule: 'Daily, 8am' })).status, 201);
  });
  await ok('login via email and mobile persists to logins.json', async () => {
    const emailLogin = await call('POST', '/api/logins', { method: 'email', email: 'sharma.employer@example.in', password: 'password123' });
    assert.strictEqual(emailLogin.status, 201);
    assert.strictEqual(emailLogin.body.status, 'authenticated');
    assert.strictEqual(emailLogin.body.method, 'email');

    const mobileLogin = await call('POST', '/api/logins', { method: 'mobile', phone: '9810012345', otp: '123456', step: 'otp' });
    assert.strictEqual(mobileLogin.status, 201);
    assert.strictEqual(mobileLogin.body.role, 'helper'); // matched to Sunita Sharma in seed data

    const invalid = await call('POST', '/api/logins', { method: 'email', email: 'bad-email' });
    assert.strictEqual(invalid.status, 400);

    const onDisk = JSON.parse(fs.readFileSync(path.join(tmp, 'logins.json'), 'utf8'));
    assert.ok(onDisk.some((l) => l.id === emailLogin.body.id));
    assert.ok(onDisk.some((l) => l.id === mobileLogin.body.id));
  });
  await ok('server source and data folder are not served as static files', async () => {
    for (const p of ['/server.js', '/package.json', '/data/workers.json']) assert.strictEqual((await fetch(base + p)).status, 404);
  });
  server.close();
  console.log(`\n${passed} checks passed` + (process.exitCode ? ' — with failures' : ''));
})();
