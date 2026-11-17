/**
 * routes/ledger.js — Ledger CRUD API with Bahi-Khata State Machine Protection.
 * 
 * Enforces mutual-consent invariants:
 * - New entries start as 'pending'
 * - Only the helper can confirm or dispute
 * - Confirmed records are immutable and cannot be deleted or arbitrarily updated
 */
const express = require('express');
const router = express.Router();
const storage = require('../services/storage');

const fieldErrors = (errors) =>
  Object.fromEntries(Object.entries(errors || {}).map(([k, v]) => [k, (v && v.en) || String(v)]));

// GET /api/ledger — List ledger entries with optional filters (?workerId=, ?status=, ?type=)
router.get('/', async (req, res, next) => {
  try {
    const list = await storage.list('ledger', req.query);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/ledger/:id — Get a single entry
router.get('/:id', async (req, res, next) => {
  try {
    const entry = await storage.get('ledger', req.params.id);
    if (!entry) return res.status(404).json({ error: 'Ledger entry not found.' });
    res.json(entry);
  } catch (err) {
    next(err);
  }
});

// POST /api/ledger — Create an entry (always quarantined as 'pending')
router.post('/', async (req, res, next) => {
  try {
    const out = await storage.create('ledger', req.body);
    if (out.errors) {
      return res.status(400).json({ error: 'Validation failed', errors: fieldErrors(out.errors) });
    }
    res.status(201).json(out.record);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/ledger/:id — State machine transitions (confirm, dispute, resubmit)
// ACADEMIC PROTOTYPE NOTE: The `actor` parameter ('helper' | 'employer') is simulated on an
// honour-system basis for viva demonstration. It validates the bilateral business logic and
// state transition rules, but does NOT represent cryptographic authentication or authorization.
router.patch('/:id', async (req, res, next) => {
  try {
    const out = await storage.applyLedgerAction(req.params.id, req.body);
    if (out.entry) return res.json(out.entry);

    res.status(out.status || 400).json({
      error: out.message,
      errors: out.errors ? fieldErrors(out.errors) : undefined,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/ledger/:id — Guarded update preventing arbitrary modification of confirmed records
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await storage.get('ledger', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ledger entry not found.' });

    if (existing.status === 'confirmed') {
      return res.status(409).json({
        error: 'Confirmed ledger records are final and cannot be modified.',
      });
    }

    // If request contains state-transition action, delegate to state machine
    if (req.body.action) {
      const out = await storage.applyLedgerAction(req.params.id, req.body);
      if (out.entry) return res.json(out.entry);
      return res.status(out.status || 400).json({ error: out.message });
    }

    const out = await storage.update('ledger', req.params.id, req.body);
    if (out.status) return res.status(out.status).json({ error: out.message });
    res.json(out.record);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/ledger/:id — Delete entry (only pending or disputed; confirmed cannot be deleted)
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await storage.get('ledger', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Ledger entry not found.' });

    if (existing.status === 'confirmed') {
      return res.status(409).json({
        error: 'Confirmed ledger records form part of the permanent financial audit trail and cannot be deleted.',
      });
    }

    const out = await storage.remove('ledger', req.params.id);
    if (out.status) return res.status(out.status).json({ error: out.message });
    res.status(200).json({ success: true, message: 'Ledger entry deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
