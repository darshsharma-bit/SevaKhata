/**
 * models/Feedback.js — Mongoose Schema for Feedback, Support, and Verification inquiries.
 */
const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  kind: {
    type: String,
    required: [true, 'Inquiry kind is required.'],
    enum: ['support', 'feedback', 'verification'],
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required.'],
    trim: true,
    maxlength: 60,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    trim: true,
    lowercase: true,
    maxlength: 80,
  },
  subject: {
    type: String,
    required: [true, 'Subject is required.'],
    trim: true,
    minlength: 5,
    maxlength: 100,
  },
  message: {
    type: String,
    required: [true, 'Message is required.'],
    trim: true,
    minlength: 20,
    maxlength: 1000,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  relatedWorkerId: {
    type: String,
    trim: true,
    maxlength: 40,
    default: '',
  },
  status: {
    type: String,
    enum: ['open', 'resolved', 'closed'],
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

module.exports = mongoose.model('Feedback', FeedbackSchema);
