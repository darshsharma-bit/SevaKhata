/**
 * routes/workers.js — Full CRUD API for Worker / Helper Profiles.
 */
const express = require('express');
const router = express.Router();
const storage = require('../services/storage');

const fieldErrors = (errors) =>
  Object.fromEntries(Object.entries(errors || {}).map(([k, v]) => [k, (v && v.en) || String(v)]));

// GET /api/workers — List all workers with optional filters (?q=, ?category=, ?location=)
router.get('/', async (req, res, next) => {
  try {
    const list = await storage.list('workers', req.query);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/workers/:id — Get a single worker by ID
router.get('/:id', async (req, res, next) => {
  try {
    const worker = await storage.get('workers', req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found.' });
    res.json(worker);
  } catch (err) {
    next(err);
  }
});

// POST /api/workers — Create a new worker
router.post('/', async (req, res, next) => {
  try {
    const out = await storage.create('workers', req.body);
    if (out.errors) {
      return res.status(400).json({ error: 'Validation failed', errors: fieldErrors(out.errors) });
    }
    res.status(201).json(out.record);
  } catch (err) {
    next(err);
  }
});

// PUT /api/workers/:id — Full update of an existing worker
router.put('/:id', async (req, res, next) => {
  try {
    const out = await storage.update('workers', req.params.id, req.body);
    if (out.status) return res.status(out.status).json({ error: out.message });
    res.json(out.record);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/workers/:id — Partial update of a worker
router.patch('/:id', async (req, res, next) => {
  try {
    const out = await storage.update('workers', req.params.id, req.body);
    if (out.status) return res.status(out.status).json({ error: out.message });
    res.json(out.record);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/workers/:id — Delete a worker (rejects if active bookings or ledger history exist)
router.delete('/:id', async (req, res, next) => {
  try {
    const out = await storage.remove('workers', req.params.id);
    if (out.status) return res.status(out.status).json({ error: out.message });
    res.status(200).json({ success: true, message: 'Worker deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
