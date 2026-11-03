/**
 * SevaKhata — shared record logic (UMD: browser + Node).
 *
 *  - buildRecord(): validate + sanitise a payload into a stored record
 *  - applyLedgerAction(): the Pending -> Confirmed / Disputed state machine
 *  - balance(): the Hisaab rule (only CONFIRMED entries reach the balance)
 *  - trustScore(): transparent 0–100 score used by the directory
 *
 * server.js and the offline (localStorage) path in the browser both call the
 * same functions, so behaviour is identical whether or not the server runs.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./validation.js'));
  else root.SKRecords = factory(root.SKValidate);
})(typeof self !== 'undefined' ? self : this, function (V) {
  'use strict';

  const clean = (v, max = 400) =>
    String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, max);

  const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const EARNING_TYPES = ['attendance', 'bonus'];     // add to what the household owes
  const PAID_TYPES = ['payment', 'advance'];         // reduce what the household owes

  /** @returns {{record?:object, errors?:object}} */
  function buildRecord(resource, payload, ctx = {}) {
    const p = payload || {};
    const now = new Date().toISOString();

    if (resource === 'workers') {
      const check = V.validate(V.SCHEMAS.worker, p);
      const skills = Array.isArray(p.skills) ? p.skills : String(p.skills || '').split(',');
      const skillList = skills.map((s) => clean(s, 30)).filter(Boolean).slice(0, 8);
      const errors = Object.assign({}, check.errors);
      if (!skillList.length || skillList.some((s) => s.length < 2)) errors.skills = { key: 'v.skills', en: 'Add at least one skill (2+ letters each, comma separated).' };
      if (Object.keys(errors).length) return { errors };
      return {
        record: {
          id: makeId('w'), name: clean(p.name, 60), phone: clean(p.phone, 10), email: clean(p.email, 80).toLowerCase(),
          category: p.category, skills: skillList, experienceYears: Number(p.experienceYears),
          location: clean(p.location, 80), rateType: p.rateType, rate: Number(p.rate),
          idType: p.idType, idLast4: clean(p.idLast4, 4).toUpperCase(),
          about: clean(p.about, 300), verified: false, rating: null, reviews: 0, createdAt: now
        }
      };
    }

    if (resource === 'bookings') {
      const check = V.validate(V.SCHEMAS.booking, p);
      if (!check.valid) return { errors: check.errors };
      const worker = p.workerId && ctx.workers ? ctx.workers.find((w) => w.id === p.workerId) : null;
      if (p.requestKind === 'existing' && !worker) return { errors: { workerId: { key: 'v.chooseWorker', en: 'Please pick the helper.' } } };
      return {
        record: {
          id: makeId('b'), requestKind: p.requestKind, householdName: clean(p.householdName, 60), contactName: clean(p.contactName, 60),
          phone: clean(p.phone, 10), email: clean(p.email, 80).toLowerCase(), category: p.category,
          workerId: worker ? worker.id : '', workerName: worker ? worker.name : '',
          location: clean(p.location, 80), startDate: p.startDate, schedule: clean(p.schedule, 80),
          offeredRate: p.offeredRate ? Number(p.offeredRate) : null, notes: clean(p.notes, 400), status: 'open', createdAt: now
        }
      };
    }

    if (resource === 'ledger') {
      const check = V.validate(V.SCHEMAS.ledger, p);
      if (!check.valid) return { errors: check.errors };
      const worker = ctx.workers ? ctx.workers.find((w) => w.id === p.workerId) : null;
      if (!worker) return { errors: { workerId: { key: 'v.chooseWorker', en: 'Please pick the helper.' } } };
      const isAtt = p.type === 'attendance';
      return {
        record: {
          id: makeId('l'), workerId: worker.id, workerName: worker.name,
          householdName: clean(p.householdName, 60) || 'Sharma Household',
          type: p.type, attendanceKind: isAtt ? p.attendanceKind : '',
          days: isAtt && p.attendanceKind !== 'extra' ? Number(p.days) : null,
          date: p.date, amount: Number(p.amount), note: clean(p.note, 160),
          status: 'pending',          // THE core rule: every new entry starts quarantined
          createdBy: 'employer', disputeReason: '', createdAt: now
        }
      };
    }

    if (resource === 'feedback') {
      const check = V.validate(V.SCHEMAS.feedback, p);
      if (!check.valid) return { errors: check.errors };
      return {
        record: {
          id: makeId('f'), kind: p.kind, name: clean(p.name, 60), phone: clean(p.phone, 10), email: clean(p.email, 80).toLowerCase(),
          subject: clean(p.subject, 100), message: clean(p.message, 1000), rating: p.rating ? Number(p.rating) : null,
          relatedWorkerId: clean(p.relatedWorkerId, 40), status: 'open', createdAt: now
        }
      };
    }
    return { errors: { _: { key: 'v.unknown', en: 'Unknown resource.' } } };
  }

  /**
   * Pending -> Confirmed | Disputed (helper), Disputed -> Pending (employer resubmit).
   * Confirmed is final: there is no "undo confirm" path by design.
   */
  function applyLedgerAction(entry, body) {
    const b = body || {};
    const now = new Date().toISOString();
    const next = Object.assign({}, entry);
    const fail = (status, message, errors) => ({ error: { status, message, errors } });

    if (b.action === 'confirm') {
      if (b.actor !== 'helper') return fail(403, 'Only the helper can confirm an entry.');
      if (entry.status !== 'pending') return fail(409, `Only pending entries can be confirmed (this one is ${entry.status}).`);
      next.status = 'confirmed'; next.confirmedAt = now; next.disputeReason = '';
      return { entry: next };
    }
    if (b.action === 'dispute') {
      if (b.actor !== 'helper') return fail(403, 'Only the helper can dispute an entry.');
      if (entry.status !== 'pending') return fail(409, `Only pending entries can be disputed (this one is ${entry.status}).`);
      const check = V.validate(V.SCHEMAS.dispute, { reason: b.reason });
      if (!check.valid) return fail(400, 'Please give a reason (at least 10 characters).', check.errors);
      next.status = 'disputed'; next.disputedAt = now; next.disputeReason = clean(b.reason, 200);
      return { entry: next };
    }
    if (b.action === 'resubmit') {
      if (b.actor !== 'employer') return fail(403, 'Only the employer can correct and resend an entry.');
      if (entry.status !== 'disputed') return fail(409, 'Only disputed entries can be corrected and resent.');
      const amount = b.amount !== undefined && b.amount !== '' ? Number(b.amount) : entry.amount;
      if (!Number.isFinite(amount) || amount < 0 || (amount === 0 && entry.attendanceKind !== 'absent')) return fail(400, 'Enter a valid corrected amount.');
      next.history = (entry.history || []).concat([{ status: 'disputed', reason: entry.disputeReason, amount: entry.amount, at: entry.disputedAt || now }]);
      next.amount = amount; next.note = b.note !== undefined ? clean(b.note, 160) : entry.note;
      next.status = 'pending'; next.disputeReason = ''; next.resubmittedAt = now;
      return { entry: next };
    }
    return fail(400, 'Unknown action. Use confirm, dispute or resubmit.');
  }

  /** Signed effect of one entry on what the household owes the helper. */
  const signed = (e) => (EARNING_TYPES.includes(e.type) ? 1 : -1) * Number(e.amount || 0);

  /**
   * Net Payable Balance = Σ confirmed earnings + Σ confirmed bonuses
   *                       − Σ confirmed payments − Σ confirmed advances.
   * Pending and disputed entries are reported separately, never mixed in.
   */
  function balance(entries) {
    const out = { earnings: 0, bonuses: 0, payments: 0, advances: 0, confirmed: 0, pending: 0, disputed: 0, pendingCount: 0, disputedCount: 0, confirmedCount: 0 };
    (entries || []).forEach((e) => {
      if (e.status === 'confirmed') {
        out.confirmedCount++;
        if (e.type === 'attendance') out.earnings += e.amount;
        else if (e.type === 'bonus') out.bonuses += e.amount;
        else if (e.type === 'payment') out.payments += e.amount;
        else if (e.type === 'advance') out.advances += e.amount;
      } else if (e.status === 'pending') { out.pending += signed(e); out.pendingCount++; }
      else if (e.status === 'disputed') { out.disputed += signed(e); out.disputedCount++; }
    });
    out.confirmed = out.earnings + out.bonuses - out.payments - out.advances;
    return out;
  }

  /**
   * Trust score (0–100) — transparent, and driven by data in this project:
   *   30  ID check flag        30  rating (out of 5)
   *   10  experience (≤10 yrs) 30  record reliability = confirmed ÷ reviewed entries
   * No reviewed entries yet -> 15/30 (neutral) rather than punishing new helpers.
   */
  function trustScore(worker, entries) {
    const mine = (entries || []).filter((e) => e.workerId === worker.id);
    const confirmed = mine.filter((e) => e.status === 'confirmed').length;
    const disputed = mine.filter((e) => e.status === 'disputed').length;
    const reviewed = confirmed + disputed;
    const parts = {
      verified: worker.verified ? 30 : 0,
      rating: worker.rating ? Math.round((worker.rating / 5) * 30) : 0,
      experience: Math.min(Number(worker.experienceYears) || 0, 10),
      records: reviewed === 0 ? 15 : Math.round((confirmed / reviewed) * 30)
    };
    const score = Math.min(100, parts.verified + parts.rating + parts.experience + parts.records);
    const tier = score >= 80 ? 'high' : score >= 60 ? 'good' : score >= 40 ? 'building' : 'new';
    return { score, tier, parts, reviewed, confirmed, disputed };
  }

  const money = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
  const signedMoney = (n) => (n < 0 ? '−' : n > 0 ? '+' : '') + money(Math.abs(n));
  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  return { buildRecord, applyLedgerAction, balance, trustScore, signed, money, signedMoney, escapeHtml, clean, EARNING_TYPES, PAID_TYPES };
});
