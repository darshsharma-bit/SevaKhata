/**
 * services/storage/mongoStore.js — MongoDB / Mongoose Persistence Engine.
 * 
 * Implements complete CRUD using Mongoose ODM while enforcing:
 * - Direct rejection (HTTP 503) if MongoDB is offline (strictly NO silent JSON fallback)
 * - Identical business logic and validation via Records.buildRecord and Records.applyLedgerAction
 * - Safe reference checks preventing deletion of referenced workers
 */
const mongoose = require('mongoose');
const db = require('../../config/db');
const Records = require('../../js/records.js');

const Worker = require('../../models/Worker');
const Booking = require('../../models/Booking');
const LedgerRecord = require('../../models/LedgerRecord');
const Feedback = require('../../models/Feedback');
const Login = require('../../models/Login');

const MODELS = {
  workers: Worker,
  bookings: Booking,
  ledger: LedgerRecord,
  feedback: Feedback,
  logins: Login,
};

function assertConnected() {
  if (!db.isConnected()) {
    const err = new Error('Database service unavailable. DATA_STORE is configured for MongoDB but the database connection is not active.');
    err.status = 503;
    throw err;
  }
}

function idQuery(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ id: String(id) }, { _id: id }] };
  }
  return { id: String(id) };
}

module.exports = {
  name: 'mongodb',

  async list(resource, query = {}) {
    assertConnected();
    const Model = MODELS[resource];
    if (!Model) throw new Error(`Unknown resource: ${resource}`);

    const filter = {};
    if (query.category) filter.category = query.category;
    if (query.status) filter.status = query.status;
    if (query.workerId) filter.workerId = query.workerId;
    if (query.type) filter.type = query.type;
    if (query.q) {
      const q = String(query.q).trim();
      if (resource === 'workers') {
        filter.$or = [
          { name: { $regex: q, $options: 'i' } },
          { location: { $regex: q, $options: 'i' } },
          { skills: { $elemMatch: { $regex: q, $options: 'i' } } },
        ];
      } else {
        filter.$or = [
          { name: { $regex: q, $options: 'i' } },
          { note: { $regex: q, $options: 'i' } },
          { subject: { $regex: q, $options: 'i' } },
        ].filter(Boolean);
      }
    }

    const docs = await Model.find(filter).lean();
    return docs.map((doc) => {
      const copy = Object.assign({}, doc);
      delete copy._id;
      return copy;
    });
  },

  async get(resource, id) {
    assertConnected();
    const Model = MODELS[resource];
    if (!Model) throw new Error(`Unknown resource: ${resource}`);

    const doc = await Model.findOne(idQuery(id)).lean();
    if (!doc) return null;
    const copy = Object.assign({}, doc);
    delete copy._id;
    return copy;
  },

  async create(resource, payload) {
    assertConnected();
    const Model = MODELS[resource];
    if (!Model) throw new Error(`Unknown resource: ${resource}`);

    let workersList = [];
    if (resource === 'ledger' || resource === 'bookings' || resource === 'logins') {
      workersList = await Worker.find().lean();
    }
    const ctx = { workers: workersList };

    const built = Records.buildRecord(resource, payload, ctx);
    if (built.errors) return { errors: built.errors };

    const doc = new Model(built.record);
    await doc.save();
    return { record: doc.toJSON() };
  },

  async update(resource, id, updates) {
    assertConnected();
    const Model = MODELS[resource];
    if (!Model) throw new Error(`Unknown resource: ${resource}`);

    const doc = await Model.findOne(idQuery(id));
    if (!doc) return { status: 404, message: `${resource} item not found.` };

    // Whitelist safe editable fields by resource
    const allowedFields = {
      workers: ['name', 'phone', 'email', 'category', 'skills', 'experienceYears', 'location', 'rateType', 'rate', 'about', 'verified', 'rating', 'reviews'],
      bookings: ['status', 'offeredRate', 'schedule', 'notes', 'startDate'],
      feedback: ['status'],
      logins: ['status', 'remember'],
    }[resource] || [];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) doc[field] = updates[field];
    });

    await doc.save();
    return { record: doc.toJSON() };
  },

  async remove(resource, id) {
    assertConnected();
    const Model = MODELS[resource];
    if (!Model) throw new Error(`Unknown resource: ${resource}`);

    // Reference integrity check before deleting a worker
    if (resource === 'workers') {
      const activeBooking = await Booking.findOne({ workerId: id, status: { $ne: 'cancelled' } });
      if (activeBooking) {
        return { status: 409, message: 'Cannot delete worker with active bookings.' };
      }

      const ledgerEntry = await LedgerRecord.findOne({ workerId: id });
      if (ledgerEntry) {
        return { status: 409, message: 'Cannot delete worker who has existing ledger history.' };
      }
    }

    const res = await Model.deleteOne(idQuery(id));
    if (res.deletedCount === 0) {
      return { status: 404, message: `${resource} item not found.` };
    }
    return { success: true };
  },

  async applyLedgerAction(id, body) {
    assertConnected();
    const doc = await LedgerRecord.findOne(idQuery(id));
    if (!doc) return { status: 404, message: 'Ledger entry not found.' };

    const plain = doc.toJSON();
    const applied = Records.applyLedgerAction(plain, body);
    if (applied.error) return applied.error;

    Object.assign(doc, applied.entry);
    await doc.save();
    return { entry: doc.toJSON() };
  },
};
