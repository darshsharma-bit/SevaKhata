/**
 * SevaKhata — Node.js & Express Server (Evaluation 3).
 *
 * Capabilities:
 * - Dual persistence engine: local JSON files (DATA_STORE=json) or MongoDB/Mongoose (DATA_STORE=mongodb)
 * - Complete CRUD REST API for Workers, Bookings, Ledger, Feedback, and Logins
 * - Re-validates every incoming write authoritative via js/validation.js & js/records.js
 * - Serves the static multi-page frontend with protected internal routes
 */
require('dotenv').config();

const path = require('path');
const express = require('express');
const db = require('./config/db');
const storage = require('./services/storage');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const RESOURCES = ['workers', 'bookings', 'ledger', 'feedback', 'logins'];

/* ---------------------------------- app ---------------------------------- */
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));

// Cross-origin and development headers (e.g. for VS Code Live Server on :5500)
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin || '';
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isMongo = storage.mode === 'mongodb';
  res.json({
    ok: true,
    app: 'sevakhata',
    version: '0.3.0',
    dataStore: storage.mode,
    mongoStatus: db.isConnected() ? 'connected' : (isMongo ? 'disconnected' : 'n/a'),
    resources: RESOURCES,
  });
});

/* ------------------------------ REST API Routes ------------------------------ */
app.use('/api/workers', require('./routes/workers'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/ledger', require('./routes/ledger'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/logins', require('./routes/logins'));

app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route.' }));

/* ------------------------------ static files ------------------------------ */
// Internal directories and secrets are strictly blocked from being served as static assets
const BLOCKED = /^\/(server\.js|package(-lock)?\.json|node_modules|data|scripts|config|models|services|routes|\.git|\.agents|\.claude|agent|\.env)(\/|$)/i;
app.use((req, res, next) => (BLOCKED.test(req.path) ? res.status(404).send('Not found') : next()));
app.use(express.static(ROOT, { extensions: ['html'], dotfiles: 'ignore', index: 'index.html' }));

/* ------------------------------ error handler ------------------------------ */
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }
  if (err && err.name === 'ValidationError') {
    const errors = err.errors ? Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message])) : {};
    return res.status(400).json({ error: 'Validation failed', errors });
  }
  if (err && err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate record: an item with this unique identifier already exists.' });
  }
  if (err && err.status) {
    return res.status(err.status).json({ error: err.message, errors: err.errors });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

/* ------------------------------ server boot ------------------------------ */
async function boot() {
  if (storage.mode === 'mongodb') {
    try {
      await db.connectDB();
    } catch (err) {
      console.warn('  [NOTICE] MongoDB could not be connected on startup. Server will start, but MongoDB requests will return 503.');
    }
  }

  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`\n  ======================================================`);
      console.log(`  SevaKhata (सेवाखाता) — Evaluation 3 Server Active`);
      console.log(`  ======================================================`);
      console.log(`  URL             ->  http://localhost:${PORT}`);
      console.log(`  Data Store Mode ->  ${storage.mode.toUpperCase()}`);
      if (storage.mode === 'json') {
        console.log(`  JSON Data Dir   ->  ${process.env.SEVAKHATA_DATA_DIR || path.join(ROOT, 'data')}`);
      } else {
        console.log(`  MongoDB Status  ->  ${db.isConnected() ? 'CONNECTED' : 'DISCONNECTED'}`);
      }
      console.log(`  ======================================================\n`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  boot();
}

module.exports = app;
