/**
 * routes/feedback.js — Full CRUD API for Feedback & Support Inquiries.
 */
const express = require('express');
const router = express.Router();
const storage = require('../services/storage');

const fieldErrors = (errors) =>
  Object.fromEntries(Object.entries(errors || {}).map(([k, v]) => [k, (v && v.en) || String(v)]));

// GET /api/feedback — List all inquiries
router.get('/', async (req, res, next) => {
  try {
    const list = await storage.list('feedback', req.query);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/feedback/:id — Get a single feedback message
router.get('/:id', async (req, res, next) => {
  try {
    const item = await storage.get('feedback', req.params.id);
    if (!item) return res.status(404).json({ error: 'Feedback message not found.' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/feedback — Submit a message
router.post('/', async (req, res, next) => {
  try {
    const out = await storage.create('feedback', req.body);
    if (out.errors) {
      return res.status(400).json({ error: 'Validation failed', errors: fieldErrors(out.errors) });
    }
    res.status(201).json(out.record);
  } catch (err) {
    next(err);
  }
});

// PUT /api/feedback/:id — Update feedback (e.g. status)
router.put('/:id', async (req, res, next) => {
  try {
    const out = await storage.update('feedback', req.params.id, req.body);
    if (out.status) return res.status(out.status).json({ error: out.message });
    res.json(out.record);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/feedback/:id — Partial update (e.g. resolve)
router.patch('/:id', async (req, res, next) => {
  try {
    const out = await storage.update('feedback', req.params.id, req.body);
    if (out.status) return res.status(out.status).json({ error: out.message });
    res.json(out.record);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/feedback/:id — Remove feedback
router.delete('/:id', async (req, res, next) => {
  try {
    const out = await storage.remove('feedback', req.params.id);
    if (out.status) return res.status(out.status).json({ error: out.message });
    res.status(200).json({ success: true, message: 'Feedback entry deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
