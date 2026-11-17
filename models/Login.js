/**
 * models/Login.js — Mongoose Schema for Login Sessions / Auth Audit Trail.
 * 
 * In accordance with academic demo security guidelines:
 * - Plaintext passwords and OTPs are NEVER stored.
 * - Records method, masked identifier, resolved role, and timestamp.
 */
const mongoose = require('mongoose');

const LoginSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  method: {
    type: String,
    required: true,
    enum: ['email', 'mobile'],
  },
  identifier: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['employer', 'helper', 'user'],
    default: 'user',
    index: true,
  },
  name: {
    type: String,
    trim: true,
    maxlength: 60,
    default: '',
  },
  status: {
    type: String,
    enum: ['authenticated', 'pending', 'expired'],
    default: 'authenticated',
  },
  remember: {
    type: Boolean,
    default: false,
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

module.exports = mongoose.model('Login', LoginSchema);
