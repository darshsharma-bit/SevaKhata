/**
 * SevaKhata — client data layer.
 *
 * 1. Server mode  : fetch()/POST/PATCH against server.js, which writes data/*.json on disk.
 * 2. Offline mode : if no server answers (e.g. the pages were opened with Live Server or
 *    straight from the file system), data lives in localStorage, seeded from
 *    js/seed-data.js. Every page then offers "Export JSON" so the evaluator can still
 *    download the updated .json file.
 *
 * Both modes use the same validation + record builders (SKValidate / SKRecords).
 */
(function () {
  'use strict';
  const R = window.SKRecords;
  const RESOURCES = ['workers', 'bookings', 'ledger', 'feedback', 'logins'];
  const LS = (r) => 'sk_data_' + r;
  const CANDIDATES = location.protocol === 'file:' ? ['http://localhost:3000'] : ['', 'http://localhost:3000'];

  let apiBase = null;           // null = not probed yet, false = offline, string = server base URL
  let probing = null;

  const listeners = new Set();
  const store = {
    get mode() { return apiBase === false ? 'offline' : apiBase === null ? 'unknown' : 'server'; },
    onModeChange(fn) { listeners.add(fn); },
  };
  const emitMode = () => listeners.forEach((fn) => fn(store.mode));

  async function timeoutFetch(url, opts, ms) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try { return await fetch(url, Object.assign({}, opts, { signal: ctl.signal })); } finally { clearTimeout(t); }
  }

  async function detect() {
    if (apiBase !== null) return apiBase;
    if (!probing) {
      probing = (async () => {
        for (const base of CANDIDATES) {
          try {
            const res = await timeoutFetch(base + '/api/health', {}, 1500);
            const body = res.ok ? await res.json() : null;
            if (body && body.app === 'sevakhata') { apiBase = base; return apiBase; }
          } catch (e) { /* try next candidate */ }
        }
        apiBase = false;
        return apiBase;
      })().then((v) => { emitMode(); return v; });
    }
    return probing;
  }

  /* ------------------------------- local cache ------------------------------- */
  function readLocal(resource) {
    try {
      const raw = localStorage.getItem(LS(resource));
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage blocked or corrupt: fall through to seed */ }
    const seed = (window.SEVAKHATA_SEED && window.SEVAKHATA_SEED[resource]) || [];
    writeLocal(resource, seed);
    return JSON.parse(JSON.stringify(seed));
  }
  function writeLocal(resource, items) {
    try { localStorage.setItem(LS(resource), JSON.stringify(items)); } catch (e) { /* private mode / quota */ }
  }

  /* ----------------------------------- API ----------------------------------- */
  class ApiError extends Error {
    constructor(message, status, errors) { super(message); this.status = status; this.errors = errors || {}; }
  }

  async function api(method, pathname, body) {
    const res = await timeoutFetch(apiBase + pathname, {
      method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined
    }, 6000);
    let data = null;
    try { data = await res.json(); } catch (e) { /* empty body */ }
    if (!res.ok) throw new ApiError((data && data.error) || 'Request failed', res.status, data && data.errors);
    return data;
  }

  /* --------------------------------- public API --------------------------------- */
  store.list = async function (resource) {
    await detect();
    if (apiBase !== false) {
      try {
        const items = await api('GET', '/api/' + resource);
        writeLocal(resource, items);        // keep the offline copy fresh
        return items;
      } catch (e) { apiBase = false; emitMode(); }
    }
    return readLocal(resource);
  };

  /** Create a record. Resolves { record, via: 'server' | 'local' } or throws ApiError(field errors). */
  store.create = async function (resource, payload) {
    await detect();
    if (apiBase !== false) {
      try {
        const record = await api('POST', '/api/' + resource, payload);
        writeLocal(resource, readLocal(resource).concat([record]));
        return { record, via: 'server' };
      } catch (e) {
        if (e instanceof ApiError) throw e;      // genuine validation failure from the server
        apiBase = false; emitMode();             // network problem: continue offline
      }
    }
    const ctx = { workers: readLocal('workers') };
    const built = R.buildRecord(resource, payload, ctx);
    if (built.errors) throw new ApiError('Validation failed', 400, Object.fromEntries(Object.entries(built.errors).map(([k, v]) => [k, v.en])));
    writeLocal(resource, readLocal(resource).concat([built.record]));
    return { record: built.record, via: 'local' };
  };

  /** Ledger state change (confirm / dispute / resubmit). */
  store.updateLedger = async function (id, body) {
    await detect();
    if (apiBase !== false) {
      try {
        const entry = await api('PATCH', '/api/ledger/' + encodeURIComponent(id), body);
        writeLocal('ledger', readLocal('ledger').map((e) => (e.id === id ? entry : e)));
        return { entry, via: 'server' };
      } catch (e) {
        if (e instanceof ApiError) throw e;
        apiBase = false; emitMode();
      }
    }
    const items = readLocal('ledger');
    const idx = items.findIndex((e) => e.id === id);
    if (idx === -1) throw new ApiError('Ledger entry not found.', 404);
    const applied = R.applyLedgerAction(items[idx], body);
    if (applied.error) throw new ApiError(applied.error.message, applied.error.status, applied.error.errors && Object.fromEntries(Object.entries(applied.error.errors).map(([k, v]) => [k, v.en])));
    items[idx] = applied.entry;
    writeLocal('ledger', items);
    return { entry: applied.entry, via: 'local' };
  };

  /** Download the current data as <resource>.json (works with no server at all). */
  store.exportJson = async function (resource) {
    const items = await store.list(resource);
    const blob = new Blob([JSON.stringify(items, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = resource + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return items.length;
  };

  /** Reset the offline copy back to the shipped seed data. */
  store.resetLocal = function () { RESOURCES.forEach((r) => { try { localStorage.removeItem(LS(r)); } catch (e) { /* ignore */ } }); };

  store.detect = detect;
  store.ApiError = ApiError;
  window.SKStore = store;
})();
