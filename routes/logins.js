/**
 * routes/logins.js — Auth / Login Session API.
 */
const express = require('express');
const router = express.Router();
const storage = require('../services/storage');

const fieldErrors = (errors) =>
  Object.fromEntries(Object.entries(errors || {}).map(([k, v]) => [k, (v && v.en) || String(v)]));

// GET /api/logins — List audit trail of logins
router.get('/', async (req, res, next) => {
  try {
    const list = await storage.list('logins', req.query);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/logins/:id — Get session by ID
router.get('/:id', async (req, res, next) => {
  try {
    const session = await storage.get('logins', req.params.id);
    if (!session) return res.status(404).json({ error: 'Session record not found.' });
    res.json(session);
  } catch (err) {
    next(err);
  }
});

// POST /api/logins — Validate credentials and record login session
router.post('/', async (req, res, next) => {
  try {
    const out = await storage.create('logins', req.body);
    if (out.errors) {
      return res.status(400).json({ error: 'Validation failed', errors: fieldErrors(out.errors) });
    }
    res.status(201).json(out.record);
  } catch (err) {
    next(err);
  }
});

// PUT / PATCH /api/logins/:id — Explicitly prohibited (audit logs are immutable)
router.put('/:id', (req, res) => {
  res.status(405).json({ error: 'Modification of login audit records is prohibited. Login sessions are immutable audit trails.' });
});

router.patch('/:id', (req, res) => {
  res.status(405).json({ error: 'Modification of login audit records is prohibited. Login sessions are immutable audit trails.' });
});

// DELETE /api/logins/:id — Revoke / remove login session
router.delete('/:id', async (req, res, next) => {
  try {
    const out = await storage.remove('logins', req.params.id);
    if (out.status) return res.status(out.status).json({ error: out.message });
    res.status(200).json({ success: true, message: 'Session revoked successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
