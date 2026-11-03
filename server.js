/**
 * SevaKhata — local server (Evaluation 2).
 *
 *  - Serves the static site (HTML / CSS / JS / assets)
 *  - Exposes a small JSON API that persists to ./data/*.json
 *
 *      GET   /api/health
 *      GET   /api/workers        POST /api/workers
 *      GET   /api/bookings       POST /api/bookings
 *      GET   /api/ledger         POST /api/ledger        PATCH /api/ledger/:id
 *      GET   /api/feedback       POST /api/feedback
 *
 * Every write is re-validated here with the SAME rules the browser uses
 * (js/validation.js + js/records.js). There is no authentication yet, so the
 * helper/employer "actor" on PATCH is an honour-system field, not security.
 */
const fs = require('fs');
const path = require('path');
const express = require('express');
const Records = require('./js/records.js');

const ROOT = __dirname;
const DATA_DIR = process.env.SEVAKHATA_DATA_DIR || path.join(ROOT, 'data');
const PORT = Number(process.env.PORT) || 3000;
const RESOURCES = ['workers', 'bookings', 'ledger', 'feedback'];

/* ------------------------------ JSON file store ------------------------------ */
const fileFor = (resource) => path.join(DATA_DIR, resource + '.json');
let queue = Promise.resolve();   // serialises read-modify-write so concurrent requests cannot clobber each other

async function readAll(resource) {
  try {
    const raw = await fs.promises.readFile(fileFor(resource), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeAll(resource, items) {
  const target = fileFor(resource);
  const tmp = target + '.tmp';
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  await fs.promises.writeFile(tmp, JSON.stringify(items, null, 2) + '\n', 'utf8');
  await fs.promises.rename(tmp, target);   // atomic replace: a crash never leaves half a file
}

/** Run fn(items) -> { items?, result } while holding the write queue. */
function mutate(resource, fn) {
  const run = queue.then(async () => {
    const items = await readAll(resource);
    const out = await fn(items);
    if (out.items) await writeAll(resource, out.items);
    return out.result;
  });
  queue = run.catch(() => {});
  return run;
}

/* ---------------------------------- app ---------------------------------- */
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));

// Allow the pages to talk to this server when they are opened from another
// localhost origin (e.g. VS Code Live Server on :5500).
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin || '';
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', (req, res) => res.json({ ok: true, app: 'sevakhata', resources: RESOURCES }));

const fieldErrors = (errors) =>
  Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v.en || String(v)]));

RESOURCES.forEach((resource) => {
  app.get('/api/' + resource, async (req, res, next) => {
    try { res.json(await readAll(resource)); } catch (err) { next(err); }
  });

  app.post('/api/' + resource, async (req, res, next) => {
    try {
      const record = await mutate(resource, async (items) => {
        // Ledger and bookings need to look up the worker the entry refers to.
        const ctx = (resource === 'ledger' || resource === 'bookings') ? { workers: await readAll('workers') } : {};
        const built = Records.buildRecord(resource, req.body, ctx);
        if (built.errors) return { result: { errors: built.errors } };
        return { items: items.concat([built.record]), result: { record: built.record } };
      });
      if (record.errors) return res.status(400).json({ error: 'Validation failed', errors: fieldErrors(record.errors) });
      res.status(201).json(record.record);
    } catch (err) { next(err); }
  });
});

app.patch('/api/ledger/:id', async (req, res, next) => {
  try {
    const out = await mutate('ledger', async (items) => {
      const idx = items.findIndex((e) => e.id === req.params.id);
      if (idx === -1) return { result: { status: 404, message: 'Ledger entry not found.' } };
      const applied = Records.applyLedgerAction(items[idx], req.body);
      if (applied.error) return { result: applied.error };
      const next = items.slice(); next[idx] = applied.entry;
      return { items: next, result: { entry: applied.entry } };
    });
    if (out.entry) return res.json(out.entry);
    res.status(out.status || 400).json({ error: out.message, errors: out.errors ? fieldErrors(out.errors) : undefined });
  } catch (err) { next(err); }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route.' }));

/* ------------------------------ static files ------------------------------ */
// Source/config/data are not meant to be browsed; data is reachable only via the API.
const BLOCKED = /^\/(server\.js|package(-lock)?\.json|node_modules|data|scripts|\.git|\.agents|\.claude|agent|\.env)(\/|$)/i;
app.use((req, res, next) => (BLOCKED.test(req.path) ? res.status(404).send('Not found') : next()));
app.use(express.static(ROOT, { extensions: ['html'], dotfiles: 'ignore', index: 'index.html' }));

app.use((err, req, res, next) => {          // eslint-disable-line no-unused-vars
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  SevaKhata is running  ->  http://localhost:${PORT}`);
    console.log(`  JSON data files       ->  ${DATA_DIR}\n`);
  });
}

module.exports = app;
