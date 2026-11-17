/**
 * models/LedgerRecord.js — Mongoose Schema for the Bahi-Khata Ledger Entries.
 * 
 * Enforces the core SevaKhata invariant:
 * - Every new entry starts as 'pending'.
 * - Only the counterparty can transition to 'confirmed' or 'disputed'.
 * - Confirmed is immutable.
 */
const mongoose = require('mongoose');

const LedgerRecordSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  workerId: {
    type: String,
    required: [true, 'workerId reference is required.'],
    index: true,
    trim: true,
  },
  workerName: {
    type: String,
    required: [true, 'workerName is required.'],
    trim: true,
  },
  householdName: {
    type: String,
    required: [true, 'householdName is required.'],
    trim: true,
    default: 'Sharma Household',
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required.'],
    enum: ['attendance', 'bonus', 'payment', 'advance'],
    index: true,
  },
  attendanceKind: {
    type: String,
    enum: ['', 'full', 'half', 'extra', 'absent'],
    default: '',
  },
  days: {
    type: Number,
    default: null,
  },
  date: {
    type: String,
    required: [true, 'Date is required.'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.'],
    index: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required.'],
    min: 0,
  },
  note: {
    type: String,
    trim: true,
    maxlength: 160,
    default: '',
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'disputed'],
    default: 'pending',
    index: true,
  },
  createdBy: {
    type: String,
    enum: ['employer', 'helper'],
    default: 'employer',
  },
  disputeReason: {
    type: String,
    trim: true,
    maxlength: 200,
    default: '',
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
  confirmedAt: {
    type: String,
    default: null,
  },
  disputedAt: {
    type: String,
    default: null,
  },
  resubmittedAt: {
    type: String,
    default: null,
  },
  history: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
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

module.exports = mongoose.model('LedgerRecord', LedgerRecordSchema);
