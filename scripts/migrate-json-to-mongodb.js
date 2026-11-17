/**
 * scripts/migrate-json-to-mongodb.js — Safe JSON to MongoDB Migration Tool.
 * 
 * Evaluation 3 Requirement:
 * - Reads data/*.json files
 * - Validates records against Mongoose schemas
 * - Safely upserts records by their unique 'id' (idempotent: safe to run multiple times)
 * - Retains original JSON files untouched
 * - Reports detailed counts and any rejection reasons
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const LedgerRecord = require('../models/LedgerRecord');
const Feedback = require('../models/Feedback');
const Login = require('../models/Login');

const DATA_DIR = path.join(__dirname, '..', 'data');

const RESOURCES = [
  { name: 'workers', model: Worker },
  { name: 'bookings', model: Booking },
  { name: 'ledger', model: LedgerRecord },
  { name: 'feedback', model: Feedback },
  { name: 'logins', model: Login },
];

async function migrate() {
  console.log('\n========================================================');
  console.log('  SevaKhata — JSON to MongoDB Migration Utility');
  console.log('========================================================\n');

  try {
    await db.connectDB();
  } catch (err) {
    console.error('Fatal: Cannot connect to MongoDB (' + (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sevakhata') + ').');
    console.error('Reason: ' + err.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Ensure MongoDB service is running (e.g. net start MongoDB or mongod.exe)');
    console.error('  2. Or set MONGODB_URI in your .env file to a valid MongoDB connection string');
    process.exit(1);
  }

  const summary = [];

  for (const { name, model } of RESOURCES) {
    const filePath = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`[SKIP] File not found: ${filePath}`);
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    let items = [];
    try {
      items = JSON.parse(raw);
    } catch (e) {
      console.error(`[ERROR] Invalid JSON in ${name}.json: ${e.message}`);
      continue;
    }

    if (!Array.isArray(items)) {
      console.warn(`[SKIP] Content in ${name}.json is not an array.`);
      continue;
    }

    let successCount = 0;
    let rejectedCount = 0;
    const errors = [];

    for (const item of items) {
      if (!item.id) {
        rejectedCount++;
        errors.push({ id: '(missing)', reason: 'Item missing unique id' });
        continue;
      }

      try {
        // Safe upsert by unique 'id'
        await model.findOneAndUpdate(
          { id: item.id },
          { $set: item },
          { upsert: true, returnDocument: 'after', runValidators: true }
        );
        successCount++;
      } catch (err) {
        rejectedCount++;
        errors.push({ id: item.id, reason: err.message });
      }
    }

    summary.push({
      resource: name,
      total: items.length,
      migrated: successCount,
      rejected: rejectedCount,
      errors,
    });
  }

  console.log('\n------------------- Migration Summary -------------------');
  console.table(
    summary.map((s) => ({
      Collection: s.resource,
      'JSON Total': s.total,
      'Migrated / Upserted': s.migrated,
      Rejected: s.rejected,
    }))
  );

  const hasErrors = summary.some((s) => s.rejected > 0);
  if (hasErrors) {
    console.log('\nRejections Details:');
    summary.forEach((s) => {
      if (s.errors.length) {
        console.log(`\n  [${s.resource}]:`);
        s.errors.forEach((e) => console.log(`    - ID: ${e.id} -> ${e.reason}`));
      }
    });
  } else {
    console.log('\nAll records migrated cleanly without data corruption or rejection.');
  }

  await db.disconnectDB();
  console.log('\nDatabase connection closed. Migration finished.\n');
}

if (require.main === module) {
  migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = migrate;
