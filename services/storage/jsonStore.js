/**
 * services/storage/jsonStore.js — Local JSON File Persistence Engine.
 * 
 * Preserves the exact Evaluation 2 persistence behavior:
 * - Atomic write via .tmp + rename to prevent data corruption
 * - Serialized mutate queue to prevent concurrent read-modify-write collisions
 * - UMD shared business validation via Records.buildRecord and Records.applyLedgerAction
 */
const fs = require('fs');
const path = require('path');
const Records = require('../../js/records.js');

const ROOT = path.resolve(__dirname, '../../');
const DATA_DIR = () => process.env.SEVAKHATA_DATA_DIR || path.join(ROOT, 'data');
const fileFor = (resource) => path.join(DATA_DIR(), resource + '.json');

let queue = Promise.resolve();

async function readAll(resource) {
  try {
    const raw = await fs.promises.readFile(fileFor(resource), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeAll(resource, items) {
  const target = fileFor(resource);
  const tmp = target + '.tmp';
  await fs.promises.mkdir(DATA_DIR(), { recursive: true });
  await fs.promises.writeFile(tmp, JSON.stringify(items, null, 2) + '\n', 'utf8');
  await fs.promises.rename(tmp, target);
}

function mutate(resource, fn) {
  const run = queue.then(async () => {
    const items = await readAll(resource);
    const out = await fn(items);
    if (out.items) await writeAll(resource, out.items);
    return out.result;
  });
  queue = run.catch(() => {});
  return run;
}

module.exports = {
  name: 'json',

  async list(resource, query = {}) {
    const items = await readAll(resource);
    if (!query || Object.keys(query).length === 0) return items;

    return items.filter((item) => {
      if (query.category && item.category !== query.category) return false;
      if (query.status && item.status !== query.status) return false;
      if (query.workerId && item.workerId !== query.workerId) return false;
      if (query.type && item.type !== query.type) return false;
      if (query.q) {
        const q = String(query.q).toLowerCase();
        const str = Object.values(item).filter((v) => typeof v === 'string').join(' ').toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  },

  async get(resource, id) {
    const items = await readAll(resource);
    return items.find((e) => e.id === id || e._id === id) || null;
  },

  async create(resource, payload) {
    return mutate(resource, async (items) => {
      const ctx = (resource === 'ledger' || resource === 'bookings' || resource === 'logins')
        ? { workers: await readAll('workers') }
        : {};
      const built = Records.buildRecord(resource, payload, ctx);
      if (built.errors) return { result: { errors: built.errors } };
      return {
        items: items.concat([built.record]),
        result: { record: built.record },
      };
    });
  },

  async update(resource, id, updates) {
    return mutate(resource, async (items) => {
      const idx = items.findIndex((e) => e.id === id || e._id === id);
      if (idx === -1) return { result: { status: 404, message: `${resource} item not found.` } };

      const existing = items[idx];
      const next = items.slice();
      const updated = Object.assign({}, existing, updates, { id: existing.id, createdAt: existing.createdAt });
      next[idx] = updated;

      return {
        items: next,
        result: { record: updated },
      };
    });
  },

  async remove(resource, id) {
    // Reference check before deleting a worker
    if (resource === 'workers') {
      const bookings = await readAll('bookings');
      const hasBooking = bookings.some((b) => b.workerId === id && b.status !== 'cancelled');
      if (hasBooking) {
        return { status: 409, message: 'Cannot delete worker with active bookings.' };
      }

      const ledger = await readAll('ledger');
      const hasLedger = ledger.some((l) => l.workerId === id);
      if (hasLedger) {
        return { status: 409, message: 'Cannot delete worker who has existing ledger history.' };
      }
    }

    return mutate(resource, async (items) => {
      const idx = items.findIndex((e) => e.id === id || e._id === id);
      if (idx === -1) return { result: { status: 404, message: `${resource} item not found.` } };

      const next = items.filter((_, i) => i !== idx);
      return {
        items: next,
        result: { success: true },
      };
    });
  },

  async applyLedgerAction(id, body) {
    return mutate('ledger', async (items) => {
      const idx = items.findIndex((e) => e.id === id || e._id === id);
      if (idx === -1) return { result: { status: 404, message: 'Ledger entry not found.' } };

      const applied = Records.applyLedgerAction(items[idx], body);
      if (applied.error) return { result: applied.error };

      const next = items.slice();
      next[idx] = applied.entry;
      return {
        items: next,
        result: { entry: applied.entry },
      };
    });
  },
};
