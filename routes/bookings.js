/**
 * routes/bookings.js — Full CRUD API for Bookings / Service Requests.
 */
const express = require('express');
const router = express.Router();
const storage = require('../services/storage');

const fieldErrors = (errors) =>
  Object.fromEntries(Object.entries(errors || {}).map(([k, v]) => [k, (v && v.en) || String(v)]));

// GET /api/bookings — List bookings
router.get('/', async (req, res, next) => {
  try {
    const list = await storage.list('bookings', req.query);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/:id — Get single booking
router.get('/:id', async (req, res, next) => {
  try {
    const booking = await storage.get('bookings', req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// POST /api/bookings — Create booking
router.post('/', async (req, res, next) => {
  try {
    const out = await storage.create('bookings', req.body);
    if (out.errors) {
      return res.status(400).json({ error: 'Validation failed', errors: fieldErrors(out.errors) });
    }
    res.status(201).json(out.record);
  } catch (err) {
    next(err);
  }
});

// PUT /api/bookings/:id — Update booking
router.put('/:id', async (req, res, next) => {
  try {
    const out = await storage.update('bookings', req.params.id, req.body);
    if (out.status) return res.status(out.status).json({ error: out.message });
    res.json(out.record);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bookings/:id — Partial update (e.g. status transition)
router.patch('/:id', async (req, res, next) => {
  try {
    const out = await storage.update('bookings', req.params.id, req.body);
    if (out.status) return res.status(out.status).json({ error: out.message });
    res.json(out.record);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/bookings/:id — Cancel / delete booking
router.delete('/:id', async (req, res, next) => {
  try {
    const out = await storage.remove('bookings', req.params.id);
    if (out.status) return res.status(out.status).json({ error: out.message });
    res.status(200).json({ success: true, message: 'Booking deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
