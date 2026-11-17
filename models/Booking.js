/**
 * models/Booking.js — Mongoose Schema for Household Service Requests / Bookings.
 */
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  requestKind: {
    type: String,
    required: true,
    enum: ['new', 'existing'],
    default: 'new',
  },
  householdName: {
    type: String,
    required: [true, 'Household name is required.'],
    trim: true,
    maxlength: 60,
  },
  contactName: {
    type: String,
    required: [true, 'Contact name is required.'],
    trim: true,
    maxlength: 60,
  },
  phone: {
    type: String,
    required: [true, 'Valid 10-digit Indian phone number is required.'],
    match: [/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian mobile number.'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 80,
    default: '',
  },
  category: {
    type: String,
    required: [true, 'Category is required.'],
    enum: ['cook', 'maid', 'driver', 'caregiver', 'gardener', 'other'],
    index: true,
  },
  workerId: {
    type: String,
    trim: true,
    default: '',
    index: true,
  },
  workerName: {
    type: String,
    trim: true,
    default: '',
  },
  location: {
    type: String,
    required: [true, 'Location is required.'],
    trim: true,
    maxlength: 80,
  },
  startDate: {
    type: String,
    required: [true, 'Start date is required.'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format.'],
  },
  schedule: {
    type: String,
    trim: true,
    maxlength: 80,
    default: '',
  },
  offeredRate: {
    type: Number,
    min: 0,
    default: null,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 400,
    default: '',
  },
  status: {
    type: String,
    enum: ['open', 'accepted', 'completed', 'cancelled'],
    default: 'open',
    index: true,
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
}, {
  timestamps: false,
  versionKey: false,
  toJSON: {
    transform: (doc, ret) => {
      delete ret._id;
      return ret;
    },
  },
});

module.exports = mongoose.model('Booking', BookingSchema);
