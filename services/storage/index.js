/**
 * services/storage/index.js — Unified Persistence Service Facade.
 * 
 * Selects between 'json' and 'mongodb' according to process.env.DATA_STORE.
 * Neither mode compromises on business validation or transaction rules.
 */
const jsonStore = require('./jsonStore');
const mongoStore = require('./mongoStore');
const db = require('../../config/db');

function getStore() {
  const mode = (process.env.DATA_STORE || 'json').toLowerCase();
  return mode === 'mongodb' ? mongoStore : jsonStore;
}

module.exports = {
  get mode() {
    return (process.env.DATA_STORE || 'json').toLowerCase();
  },

  getStore,

  isReady() {
    if (this.mode === 'mongodb') {
      return db.isConnected();
    }
    return true;
  },

  async list(resource, query) {
    return getStore().list(resource, query);
  },

  async get(resource, id) {
    return getStore().get(resource, id);
  },

  async create(resource, payload) {
    return getStore().create(resource, payload);
  },

  async update(resource, id, updates) {
    return getStore().update(resource, id, updates);
  },

  async remove(resource, id) {
    return getStore().remove(resource, id);
  },

  async applyLedgerAction(id, body) {
    return getStore().applyLedgerAction(id, body);
  },
};
