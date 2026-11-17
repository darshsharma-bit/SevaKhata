/**
 * models/Worker.js — Mongoose Schema for Helper / Domestic Worker Profiles.
 */
const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Worker name is required.'],
    trim: true,
    maxlength: 60,
  },
  phone: {
    type: String,
    required: [true, 'Valid 10-digit Indian phone number is required.'],
    match: [/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian mobile number.'],
    trim: true,
    index: true,
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
  skills: {
    type: [String],
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: 'Worker must have at least one skill.',
    },
    default: [],
  },
  experienceYears: {
    type: Number,
    required: [true, 'Years of experience is required.'],
    min: 0,
    max: 50,
  },
  location: {
    type: String,
    required: [true, 'Location is required.'],
    trim: true,
    maxlength: 80,
    index: true,
  },
  rateType: {
    type: String,
    required: [true, 'Rate type is required.'],
    enum: ['daily', 'monthly'],
  },
  rate: {
    type: Number,
    required: [true, 'Rate is required.'],
    min: 1,
    max: 100000,
  },
  idType: {
    type: String,
    required: [true, 'ID type is required.'],
    enum: ['aadhaar', 'voter', 'dl', 'pan'],
  },
  idLast4: {
    type: String,
    required: [true, 'ID last 4 digits/characters are required.'],
    match: [/^[A-Z0-9]{4}$/, 'idLast4 must be exactly 4 alphanumeric characters.'],
    uppercase: true,
  },
  about: {
    type: String,
    trim: true,
    maxlength: 300,
    default: '',
  },
  verified: {
    type: Boolean,
    default: false,
    index: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  reviews: {
    type: Number,
    min: 0,
    default: 0,
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

WorkerSchema.index({ name: 'text', skills: 'text', location: 'text' });

module.exports = mongoose.model('Worker', WorkerSchema);
