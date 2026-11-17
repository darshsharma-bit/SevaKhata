/**
 * Smoke test: shared rules, JSON API, MongoDB models & Full CRUD.
 *   npm test
 * Runs against a temporary COPY of data/, so real seed files are untouched.
 */
require('dotenv').config();

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const V = require('../js/validation.js');
const R = require('../js/records.js');
const mongoStore = require('../services/storage/mongoStore');
const db = require('../config/db');

let passed = 0;
const ok = (name, fn) =>
  Promise.resolve()
    .then(fn)
    .then(
      () => {
        passed++;
        console.log('  ✓ ' + name);
      },
      (e) => {
        console.error('  ✗ ' + name + '\n    ' + e.message);
        process.exitCode = 1;
      }
    );

(async () => {
  console.log('\n--- 1. Validation Rules ---');
  await ok('Indian phone numbers', () => {
    ['9810012345', '6000000000'].forEach((p) =>
      assert.strictEqual(V.validateField(V.SCHEMAS.worker, 'phone', p, {}), null)
    );
    ['5810012345', '98100123', '98100123456', 'abcdefghij'].forEach((p) =>
      assert.ok(V.validateField(V.SCHEMAS.worker, 'phone', p, {}))
    );
  });
  await ok('ID formats by type', () => {
    const chk = (type, v) => V.validateField(V.SCHEMAS.workerForm, 'idNumber', v, { idType: type });
    assert.strictEqual(chk('aadhaar', '234567890123'), null);
    assert.ok(chk('aadhaar', '123456789012')); // cannot start with 1
    assert.strictEqual(chk('pan', 'ABCDE1234F'), null);
    assert.ok(chk('pan', 'abcde'));
  });
  await ok('wage must be positive and in range', () => {
    const s = V.SCHEMAS.workerForm,
      all = { rateType: 'daily' };
    assert.ok(V.validateField(s, 'rate', '0', all));
    assert.ok(V.validateField(s, 'rate', '-5', all));
    assert.ok(V.validateField(s, 'rate', '50', all));
    assert.strictEqual(V.validateField(s, 'rate', '500', all), null);
    assert.strictEqual(V.validateField(s, 'rate', '14000', { rateType: 'monthly' }), null);
  });

  console.log('\n--- 2. Ledger Business Rules & State Machine ---');
  await ok('Only CONFIRMED entries reach the balance', () => {
    const b = R.balance([
      { type: 'attendance', amount: 4000, status: 'confirmed' },
      { type: 'advance', amount: 1000, status: 'confirmed' },
      { type: 'attendance', amount: 500, status: 'pending' },
      { type: 'attendance', amount: 300, status: 'pending' },
      { type: 'payment', amount: 2000, status: 'disputed' },
    ]);
    assert.strictEqual(b.confirmed, 3000);
    assert.strictEqual(b.pending, 800);
    assert.strictEqual(b.disputed, -2000);
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
    assert.strictEqual(r.status, 'pending');
    assert.strictEqual(r.amount, 450);
  });

  console.log('\n--- 3. API & Complete CRUD Tests (JSON Storage Mode) ---');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sevakhata-'));
  fs.readdirSync(path.join(__dirname, '..', 'data'))
    .filter((f) => f.endsWith('.json'))
    .forEach((f) => fs.copyFileSync(path.join(__dirname, '..', 'data', f), path.join(tmp, f)));
  process.env.SEVAKHATA_DATA_DIR = tmp;
  process.env.DATA_STORE = 'json';

  const app = require('../server.js');
  const server = app.listen(0);
  const base = 'http://127.0.0.1:' + server.address().port;
  const call = async (method, p, body) => {
    const r = await fetch(base + p, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, body: await r.json().catch(() => null) };
  };

  await ok('GET /api/health reports status, dataStore, and version', async () => {
    const r = await call('GET', '/api/health');
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.app, 'sevakhata');
    assert.strictEqual(r.body.dataStore, 'json');
    assert.strictEqual(r.body.version, '0.3.0');
  });

  await ok('GET /api/workers returns seeded records and supports search', async () => {
    const r = await call('GET', '/api/workers');
    assert.strictEqual(r.status, 200);
    assert.ok(r.body.length >= 3);
    const filter = await call('GET', '/api/workers?category=cook');
    assert.strictEqual(filter.status, 200);
    assert.ok(filter.body.every((w) => w.category === 'cook'));
  });

  await ok('GET /api/workers/:id returns worker detail', async () => {
    const r = await call('GET', '/api/workers/w-1001');
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.name, 'Sunita Sharma');
  });

  await ok('POST /api/workers rejects invalid payload with 400 and field errors', async () => {
    const r = await call('POST', '/api/workers', { name: 'x', phone: '12' });
    assert.strictEqual(r.status, 400);
    assert.ok(r.body.errors.phone);
  });

  let createdWorkerId = null;
  await ok('POST /api/workers creates worker with masked ID (last 4 only)', async () => {
    const r = await call('POST', '/api/workers', {
      name: 'Pooja Verma',
      phone: '9876543210',
      category: 'maid',
      skills: 'Cleaning, Dusting',
      experienceYears: 3,
      location: 'Noida Sector 62',
      rateType: 'daily',
      rate: 450,
      idType: 'aadhaar',
      idLast4: '9988',
    });
    assert.strictEqual(r.status, 201);
    assert.strictEqual(r.body.verified, false);
    assert.strictEqual(r.body.idLast4, '9988');
    assert.ok(!('idNumber' in r.body));
    createdWorkerId = r.body.id;
  });

  await ok('PATCH /api/workers/:id updates worker fields', async () => {
    const r = await call('PATCH', '/api/workers/' + createdWorkerId, { location: 'Greater Noida West', rate: 500 });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.location, 'Greater Noida West');
    assert.strictEqual(r.body.rate, 500);
  });

  await ok('DELETE /api/workers/:id deletes unreferenced worker', async () => {
    const r = await call('DELETE', '/api/workers/' + createdWorkerId);
    assert.strictEqual(r.status, 200);
    const check = await call('GET', '/api/workers/' + createdWorkerId);
    assert.strictEqual(check.status, 404);
  });

  await ok('DELETE /api/workers/:id rejects deletion of referenced worker (409 Conflict)', async () => {
    // w-1001 is referenced in data/bookings.json and data/ledger.json
    const r = await call('DELETE', '/api/workers/w-1001');
    assert.strictEqual(r.status, 409);
    assert.ok(r.body.error.includes('active bookings') || r.body.error.includes('ledger history'));
  });

  // Bookings CRUD
  let createdBookingId = null;
  await ok('POST /api/bookings creates booking record', async () => {
    const r = await call('POST', '/api/bookings', {
      requestKind: 'new',
      householdName: 'Malhotra Family',
      contactName: 'Vivek Malhotra',
      phone: '9811223344',
      category: 'cook',
      location: 'South City 1, Gurugram',
      startDate: '2026-10-01',
      schedule: 'Daily, 7am–9am',
    });
    assert.strictEqual(r.status, 201);
    createdBookingId = r.body.id;
  });

  await ok('GET /api/bookings/:id returns single booking', async () => {
    const r = await call('GET', '/api/bookings/' + createdBookingId);
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.contactName, 'Vivek Malhotra');
  });

  await ok('PATCH /api/bookings/:id updates booking status', async () => {
    const r = await call('PATCH', '/api/bookings/' + createdBookingId, { status: 'accepted' });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.status, 'accepted');
  });

  await ok('DELETE /api/bookings/:id deletes booking', async () => {
    const r = await call('DELETE', '/api/bookings/' + createdBookingId);
    assert.strictEqual(r.status, 200);
    const check = await call('GET', '/api/bookings/' + createdBookingId);
    assert.strictEqual(check.status, 404);
  });

  // Feedback CRUD
  let createdFeedbackId = null;
  await ok('POST /api/feedback saves message', async () => {
    const r = await call('POST', '/api/feedback', {
      kind: 'feedback',
      name: 'Sunil Dutt',
      email: 'sunil@example.com',
      subject: 'Great application workflow',
      message: 'The two-way consent on ledger entries prevents all payment disputes.',
      rating: 5,
    });
    assert.strictEqual(r.status, 201);
    createdFeedbackId = r.body.id;
  });

  await ok('GET /api/feedback/:id, PATCH and PUT updates status', async () => {
    const getRes = await call('GET', '/api/feedback/' + createdFeedbackId);
    assert.strictEqual(getRes.status, 200);
    const patchRes = await call('PATCH', '/api/feedback/' + createdFeedbackId, { status: 'resolved' });
    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchRes.body.status, 'resolved');
    const putRes = await call('PUT', '/api/feedback/' + createdFeedbackId, { status: 'closed' });
    assert.strictEqual(putRes.status, 200);
    assert.strictEqual(putRes.body.status, 'closed');
  });

  await ok('DELETE /api/feedback/:id removes feedback', async () => {
    const r = await call('DELETE', '/api/feedback/' + createdFeedbackId);
    assert.strictEqual(r.status, 200);
    assert.strictEqual((await call('GET', '/api/feedback/' + createdFeedbackId)).status, 404);
  });

  // Ledger CRUD & Immutable Invariants
  let testLedgerId = null;
  await ok('POST /api/ledger starts pending; helper confirms', async () => {
    const created = await call('POST', '/api/ledger', {
      workerId: 'w-1001',
      type: 'attendance',
      attendanceKind: 'full',
      days: 1,
      date: '2026-08-15',
      amount: 500,
      status: 'confirmed', // client cannot force confirmed
    });
    assert.strictEqual(created.status, 201);
    assert.strictEqual(created.body.status, 'pending');
    testLedgerId = created.body.id;

    // Employer cannot confirm
    const empFail = await call('PATCH', '/api/ledger/' + testLedgerId, { action: 'confirm', actor: 'employer' });
    assert.strictEqual(empFail.status, 403);

    // Helper confirms
    const done = await call('PATCH', '/api/ledger/' + testLedgerId, { action: 'confirm', actor: 'helper' });
    assert.strictEqual(done.status, 200);
    assert.strictEqual(done.body.status, 'confirmed');
  });

  await ok('PUT /api/ledger/:id rejects arbitrary modification on confirmed records (409 Conflict)', async () => {
    const r = await call('PUT', '/api/ledger/' + testLedgerId, { amount: 9999 });
    assert.strictEqual(r.status, 409);
    assert.ok(r.body.error.includes('final and cannot be modified'));
  });

  await ok('DELETE /api/ledger/:id rejects deletion of confirmed records (409 Conflict)', async () => {
    const r = await call('DELETE', '/api/ledger/' + testLedgerId);
    assert.strictEqual(r.status, 409);
    assert.ok(r.body.error.includes('permanent financial audit trail'));
  });

  await ok('DELETE /api/ledger/:id allows deletion of pending entries', async () => {
    const pending = await call('POST', '/api/ledger', {
      workerId: 'w-1001',
      type: 'bonus',
      date: '2026-08-25',
      amount: 250,
      note: 'Draft test bonus',
    });
    assert.strictEqual(pending.status, 201);
    const del = await call('DELETE', '/api/ledger/' + pending.body.id);
    assert.strictEqual(del.status, 200);
  });

  await ok('Login session persistence, retrieval by ID, and session revocation', async () => {
    const emailLogin = await call('POST', '/api/logins', {
      method: 'email',
      email: 'sharma.employer@example.in',
      password: 'password123',
    });
    assert.strictEqual(emailLogin.status, 201);
    assert.strictEqual(emailLogin.body.status, 'authenticated');

    const mobileLogin = await call('POST', '/api/logins', {
      method: 'mobile',
      phone: '9810012345',
      otp: '123456',
      step: 'otp',
    });
    assert.strictEqual(mobileLogin.status, 201);
    assert.strictEqual(mobileLogin.body.role, 'helper');

    // Retrieve single login session by ID
    const fetchSession = await call('GET', '/api/logins/' + emailLogin.body.id);
    assert.strictEqual(fetchSession.status, 200);
    assert.strictEqual(fetchSession.body.identifier, 'sharma.employer@example.in');

    // PUT/PATCH is prohibited on login audit logs (405 Method Not Allowed)
    const putSession = await call('PUT', '/api/logins/' + emailLogin.body.id, { role: 'admin' });
    assert.strictEqual(putSession.status, 405);
    assert.ok(putSession.body.error.includes('prohibited'));

    // Revoke / delete session by ID
    const delSession = await call('DELETE', '/api/logins/' + emailLogin.body.id);
    assert.strictEqual(delSession.status, 200);
    const checkDeleted = await call('GET', '/api/logins/' + emailLogin.body.id);
    assert.strictEqual(checkDeleted.status, 404);
  });

  await ok('Protected routes & internal directories are blocked from static serving', async () => {
    for (const p of [
      '/server.js',
      '/package.json',
      '/data/workers.json',
      '/config/db.js',
      '/models/Worker.js',
      '/services/storage/index.js',
      '/.env',
    ]) {
      const res = await fetch(base + p);
      assert.strictEqual(res.status, 404);
    }
  });

  server.close();

  console.log('\n--- 4. MongoDB Architecture & Connection Safety ---');
  await ok('mongoStore rejects with 503 when MongoDB is offline (strictly NO silent JSON fallback)', async () => {
    try {
      await mongoStore.list('workers');
      assert.fail('Should have thrown 503 error');
    } catch (err) {
      assert.strictEqual(err.status, 503);
      assert.ok(err.message.includes('Database service unavailable'));
    }
  });

  // Check if MongoDB is available (either locally or via MONGODB_URI in .env)
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sevakhata_test';
  let mongoLive = false;
  try {
    await db.connectDB(mongoUri);
    mongoLive = true;
  } catch (e) {
    mongoLive = false;
  }

  if (mongoLive) {
    console.log(`  ℹ MongoDB Live Connection active: ${mongoUri.replace(/\/\/[^@]+@/, '//***:***@')}`);

    await ok('LIVE MONGODB: Workers collection CRUD with custom string ID (w-xxxx)', async () => {
      const created = await mongoStore.create('workers', {
        name: 'Mongo Live Worker',
        phone: '9811223344',
        category: 'cook',
        skills: 'North Indian, South Indian',
        experienceYears: 4,
        location: 'Sector 15, Gurugram',
        rateType: 'daily',
        rate: 600,
        idType: 'aadhaar',
        idLast4: '5566',
      });
      assert.ok(created.record);
      assert.strictEqual(created.record.name, 'Mongo Live Worker');
      assert.ok(created.record.id.startsWith('w-'), 'Worker ID must start with w-');
      assert.strictEqual(created.record.idLast4, '5566');

      // Read by custom ID
      const fetched = await mongoStore.get('workers', created.record.id);
      assert.strictEqual(fetched.id, created.record.id);
      assert.strictEqual(fetched.location, 'Sector 15, Gurugram');

      // Update
      const updated = await mongoStore.update('workers', created.record.id, { rate: 650, location: 'DLF Phase 2' });
      assert.strictEqual(updated.record.rate, 650);
      assert.strictEqual(updated.record.location, 'DLF Phase 2');

      // Delete
      const deleted = await mongoStore.remove('workers', created.record.id);
      assert.strictEqual(deleted.success, true);
      const verifyGone = await mongoStore.get('workers', created.record.id);
      assert.strictEqual(verifyGone, null);
    });

    await ok('LIVE MONGODB: Bookings collection CRUD with custom string ID (b-xxxx)', async () => {
      const created = await mongoStore.create('bookings', {
        requestKind: 'new',
        householdName: 'Mongo Live Household',
        contactName: 'Rohit Verma',
        phone: '9822334455',
        category: 'maid',
        location: 'Saket, New Delhi',
        startDate: '2026-11-20',
        schedule: 'Morning shift',
      });
      assert.ok(created.record, created.errors ? JSON.stringify(created.errors) : 'No record returned');
      assert.ok(created.record.id.startsWith('b-'), 'Booking ID must start with b-');

      const fetched = await mongoStore.get('bookings', created.record.id);
      assert.strictEqual(fetched.contactName, 'Rohit Verma');

      const updated = await mongoStore.update('bookings', created.record.id, { status: 'accepted' });
      assert.strictEqual(updated.record.status, 'accepted');

      const deleted = await mongoStore.remove('bookings', created.record.id);
      assert.strictEqual(deleted.success, true);
      assert.strictEqual(await mongoStore.get('bookings', created.record.id), null);
    });

    await ok('LIVE MONGODB: Ledger collection CRUD, state machine & immutability guards', async () => {
      // 1. Create starts pending
      const created = await mongoStore.create('ledger', {
        workerId: 'w-1001',
        type: 'attendance',
        attendanceKind: 'full',
        days: 1,
        date: '2026-11-15',
        amount: 550,
      });
      assert.ok(created.record, created.errors ? JSON.stringify(created.errors) : 'No record returned');
      assert.strictEqual(created.record.status, 'pending');
      assert.ok(created.record.id.startsWith('l-'), 'Ledger ID must start with l-');

      // 2. Helper confirms
      const confirmed = await mongoStore.applyLedgerAction(created.record.id, { action: 'confirm', actor: 'helper' });
      assert.ok(confirmed.entry);
      assert.strictEqual(confirmed.entry.status, 'confirmed');

      // 3. Prohibit dispute after confirmation (409)
      const disputeAttempt = await mongoStore.applyLedgerAction(created.record.id, {
        action: 'dispute',
        actor: 'helper',
        reason: 'Should be blocked',
      });
      assert.strictEqual(disputeAttempt.status, 409);

      // Clean up test entry
      const LedgerRecord = require('../models/LedgerRecord');
      await LedgerRecord.deleteOne({ id: created.record.id });
    });

    await ok('LIVE MONGODB: Feedback collection CRUD with custom string ID (f-xxxx)', async () => {
      const created = await mongoStore.create('feedback', {
        kind: 'feedback',
        name: 'Anita Roy',
        email: 'anita@example.com',
        subject: 'Service appreciation note',
        message: 'Looking for a verified cook in South Delhi and loved the clean interface.',
        rating: 5,
      });
      assert.ok(created.record, created.errors ? JSON.stringify(created.errors) : 'No record returned');
      assert.ok(created.record.id.startsWith('f-'), 'Feedback ID must start with f-');

      const updated = await mongoStore.update('feedback', created.record.id, { status: 'resolved' });
      assert.strictEqual(updated.record.status, 'resolved');

      const deleted = await mongoStore.remove('feedback', created.record.id);
      assert.strictEqual(deleted.success, true);
      assert.strictEqual(await mongoStore.get('feedback', created.record.id), null);
    });

    await ok('LIVE MONGODB: Logins collection CRUD with custom string ID (log-xxxx)', async () => {
      const created = await mongoStore.create('logins', {
        method: 'mobile',
        phone: '9810012345',
        otp: '123456',
        step: 'otp',
      });
      assert.ok(created.record);
      assert.ok(created.record.id.startsWith('log-'), 'Login ID must start with log-');
      assert.strictEqual(created.record.role, 'helper');

      const fetched = await mongoStore.get('logins', created.record.id);
      assert.strictEqual(fetched.id, created.record.id);

      const deleted = await mongoStore.remove('logins', created.record.id);
      assert.strictEqual(deleted.success, true);
      assert.strictEqual(await mongoStore.get('logins', created.record.id), null);
    });

    await db.disconnectDB();
  } else {
    console.log('  ℹ MongoDB Live Daemon: Not reachable on provided URI.');
    console.log('    -> Verified connection safety: 503 Service Unavailable returned as required.');
    console.log('    -> Verified data integrity: Zero silent fallbacks to JSON files.');
  }

  console.log(`\n========================================================`);
  console.log(`  ${passed} verification checks passed cleanly!`);
  console.log(`========================================================\n`);
})();
