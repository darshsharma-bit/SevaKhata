/**
 * ledger.html — the shared khata.
 *
 * Rule enforced everywhere on this page: a new entry is PENDING. Only the helper
 * can CONFIRM or DISPUTE it. Only CONFIRMED entries count toward the balance;
 * pending and disputed amounts are shown separately.
 */
(function () {
  'use strict';
  const I = window.SKI18N, UI = window.SKUI, R = window.SKRecords, V = window.SKValidate, h = UI.h, Store = window.SKStore;
  const { t, fmt } = I;

  document.addEventListener('DOMContentLoaded', async () => {
    I.init();
    UI.init();

    const $ = (id) => document.getElementById(id);
    const form = $('ledgerForm');
    const state = { role: 'employer', workers: [], entries: [], amountDirty: false };
    try { const r = localStorage.getItem('sk_role'); if (r === 'helper' || r === 'employer') state.role = r; } catch (e) { /* ignore */ }

    /* ------------------------------ data ------------------------------ */
    async function reload() {
      state.workers = await Store.list('workers');
      state.entries = await Store.list('ledger');
    }

    /* ------------------------- filters + rendering ------------------------- */
    const filters = () => ({
      q: $('fSearch').value.trim().toLowerCase(), worker: $('fWorker').value, status: $('fStatus').value, type: $('fType').value
    });

    function fillFilterSelects() {
      const f = filters();
      UI.fillSelect($('fWorker'), state.workers.map((w) => ({ value: w.id, label: w.name })), { placeholder: t('led.allWorkers', 'All helpers'), value: f.worker });
      UI.fillSelect($('fStatus'), V.CONST.LEDGER_STATUSES.map((s) => ({ value: s, label: t('status.' + s) })), { placeholder: t('led.allStatuses', 'All statuses'), value: f.status });
      UI.fillSelect($('fType'), V.CONST.LEDGER_TYPES.map((s) => ({ value: s, label: t('type.' + s) })), { placeholder: t('led.allTypes', 'All types'), value: f.type });
      const prev = form.elements.workerId.value;
      UI.fillSelect(form.elements.workerId, state.workers.map((w) => ({ value: w.id, label: w.name })), { placeholder: t('led.chooseWorker', 'Choose helper…'), value: prev });
    }

    function renderBalance() {
      const wid = $('fWorker').value;
      const scope = state.entries.filter((e) => !wid || e.workerId === wid);   // balance ignores status/type/search filters on purpose
      const b = R.balance(scope);
      $('balConfirmed').textContent = R.signedMoney(b.confirmed).replace('+', '');
      $('balPending').textContent = R.signedMoney(b.pending);
      $('balDisputed').textContent = R.signedMoney(b.disputed);
      $('balConfirmedNote').textContent = fmt('led.confirmedNote', { n: b.confirmedCount }, '{n} confirmed entries');
      $('balPendingNote').textContent = fmt('led.pendingNote', { n: b.pendingCount }, '{n} waiting for the helper · not in the balance yet');
      $('balDisputedNote').textContent = fmt('led.disputedNote', { n: b.disputedCount }, '{n} disputed · kept out of the balance');
    }

    function visibleEntries() {
      const f = filters();
      return state.entries.filter((e) =>
        (!f.worker || e.workerId === f.worker) && (!f.status || e.status === f.status) && (!f.type || e.type === f.type) &&
        (!f.q || (e.note + ' ' + e.workerName).toLowerCase().includes(f.q)))
        .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
    }

    function entryTitle(e) {
      let s = t('type.' + e.type, e.type);
      if (e.type === 'attendance') {
        s += ' · ' + t('att.' + e.attendanceKind, e.attendanceKind);
        if (e.days) s += ' · ' + fmt('led.daysFor', { n: e.days }, '{n} day(s)');
      }
      return s;
    }

    function entryRow(e) {
      const sign = R.signed(e) >= 0 ? 'plus' : 'minus';
      const actions = h('div', { class: 'er-actions' });
      if (e.status === 'pending') {
        if (state.role === 'helper') {
          actions.append(
            h('button', { type: 'button', class: 'btn-review-action btn-confirm', onclick: () => confirmEntry(e), 'aria-label': t('led.confirm') + ': ' + entryTitle(e) }, t('led.confirm', '✅ Confirm')),
            h('button', { type: 'button', class: 'btn-review-action btn-dispute', onclick: () => disputeDialog(e), 'aria-label': t('led.dispute') + ': ' + entryTitle(e) }, t('led.dispute', '⚠️ Dispute')));
        } else actions.append(h('span', { class: 'er-sub' }, t('led.waiting', 'Waiting for the helper')));
      } else if (e.status === 'disputed' && state.role === 'employer') {
        actions.append(h('button', { type: 'button', class: 'btn btn-ghost btn-small', onclick: () => resendDialog(e) }, t('led.resend', 'Correct & resend')));
      }
      return h('article', { class: 'entry-row', 'data-status': e.status, 'data-id': e.id },
        h('div', {},
          h('div', { class: 'er-title' }, entryTitle(e)),
          h('div', { class: 'er-sub' }, [e.workerName, UI.formatDate(e.date), e.note].filter(Boolean).join(' · ')),
          e.status === 'disputed' && e.disputeReason ? h('div', { class: 'er-reason' }, fmt('led.reasonLabel', { r: e.disputeReason }, 'Dispute reason: {r}')) : null,
          e.history && e.history.length ? h('div', { class: 'er-sub' }, fmt('led.history', { n: e.history.length }, 'Corrected {n} time(s) before')) : null),
        h('div', { class: 'er-side' }, h('div', { class: 'er-amount ' + sign }, (sign === 'plus' ? '+' : '−') + R.money(e.amount)), UI.statusPill(e.status)),
        actions);
    }

    function renderList() {
      const rows = visibleEntries();
      const list = $('entryList');
      list.textContent = '';
      $('entryCount').textContent = fmt('led.count', { n: rows.length }, '{n} entries');
      if (!rows.length) { list.append(h('div', { class: 'empty-state' }, t('led.noEntries', 'No entries match these filters.'))); return; }
      rows.forEach((e) => list.append(entryRow(e)));
    }

    function renderRole() {
      const emp = state.role === 'employer';
      document.querySelectorAll('input[name="viewRole"]').forEach((r) => { r.checked = r.value === state.role; });
      $('roleNote').textContent = emp ? t('led.roleNoteEmployer', 'The employer records entries. The helper confirms or disputes them.')
        : t('led.roleNoteHelper', 'Viewing as the helper: confirm or dispute pending entries.');
      form.hidden = !emp; $('helperNote').hidden = emp;
      $('addTitle').hidden = !emp; document.querySelector('#addPanel .panel-sub').hidden = !emp;
    }

    function renderAll() { renderRole(); renderBalance(); renderList(); }

    /* ------------------------------ actions ------------------------------ */
    async function confirmEntry(e) {
      try {
        await Store.updateLedger(e.id, { action: 'confirm', actor: 'helper' });
        UI.toast(t('led.confirmedToast', 'Entry confirmed. It now counts toward the balance.'));
      } catch (err) { UI.toast(err.message, 'error'); }
      await reload(); renderAll();
    }

    function disputeDialog(e) {
      const reason = h('textarea', { id: 'disputeReason', name: 'reason', rows: '3', maxlength: '200', placeholder: '' });
      const dform = h('form', { id: 'disputeForm', novalidate: true },
        h('p', {}, t('led.disputeHint', 'Write a short reason (at least 10 characters). The entry stays out of the balance until it is corrected.')),
        h('div', { class: 'field', style: 'margin-top:1rem' }, h('label', { for: 'disputeReason' }, t('led.reason', 'Reason')), reason),
        h('div', { class: 'modal-actions' },
          h('button', { type: 'button', class: 'btn btn-ghost', id: 'disputeCancel' }, t('led.cancel', 'Cancel')),
          h('button', { type: 'submit', class: 'btn btn-primary' }, t('led.sendDispute', 'Send dispute'))));
      const m = UI.modal({ title: t('led.disputeTitle', 'Why is this entry wrong?'), body: dform, tone: '' });
      dform.querySelector('#disputeCancel').addEventListener('click', m.close);
      UI.bindForm(dform, V.SCHEMAS.dispute, {
        async onSubmit(v) {
          await Store.updateLedger(e.id, { action: 'dispute', actor: 'helper', reason: v.reason });
          m.close(); UI.toast(t('led.disputedToast', 'Dispute recorded. The entry is kept out of the balance.'));
          await reload(); renderAll();
        }
      });
    }

    function resendDialog(e) {
      const rules = V.rules;
      const schema = { amount: e.attendanceKind === 'absent' ? [rules.number({ min: 0, max: 0 })] : [rules.required(), rules.number({ positive: true, max: 1000000 })], note: [rules.maxLen(160)] };
      const rform = h('form', { id: 'resendForm', novalidate: true },
        h('p', {}, fmt('led.resendHint', { reason: e.disputeReason }, 'The helper wrote: “{reason}”')),
        h('div', { class: 'field', style: 'margin-top:1rem' }, h('label', { for: 'rsAmount' }, t('led.newAmount', 'Corrected amount (₹)')), h('input', { id: 'rsAmount', name: 'amount', type: 'number', inputmode: 'numeric', min: '0', step: '1', value: String(e.amount) })),
        h('div', { class: 'field', style: 'margin-top:1rem' }, h('label', { for: 'rsNote' }, t('led.note', 'Note')), h('input', { id: 'rsNote', name: 'note', type: 'text', maxlength: '160', value: e.note || '' })),
        h('div', { class: 'modal-actions' },
          h('button', { type: 'button', class: 'btn btn-ghost', id: 'resendCancel' }, t('led.cancel', 'Cancel')),
          h('button', { type: 'submit', class: 'btn btn-primary' }, t('led.sendAgain', 'Resend'))));
      const m = UI.modal({ title: t('led.resendTitle', 'Correct and resend'), body: rform });
      rform.querySelector('#resendCancel').addEventListener('click', m.close);
      UI.bindForm(rform, schema, {
        async onSubmit(v) {
          await Store.updateLedger(e.id, { action: 'resubmit', actor: 'employer', amount: v.amount, note: v.note });
          m.close(); UI.toast(t('led.resentToast', 'Entry resent. It is pending again.'));
          await reload(); renderAll();
        }
      });
    }

    /* --------------------- add-entry form (dependent fields) --------------------- */
    const F = form.elements;
    function suggestion() {
      const w = state.workers.find((x) => x.id === F.workerId.value);
      if (!w || F.type.value !== 'attendance') return null;
      const kind = F.attendanceKind.value, days = Number(F.days.value) || 0;
      if (kind === 'absent') return { amount: 0, calc: t('att.absent') + ' = ' + R.money(0) };
      if (kind === 'extra') return null;
      const daily = w.rateType === 'daily' ? w.rate : w.rate / 30;
      const per = kind === 'half' ? daily / 2 : daily;
      const amount = Math.round(per * days);
      return { amount, calc: days + ' × ' + R.money(per) + ' = ' + R.money(amount) };
    }

    function syncFormShape(userChange) {
      const att = F.type.value === 'attendance';
      $('kindField').hidden = !att;
      $('daysField').hidden = !(att && F.attendanceKind.value !== 'extra');
      if (userChange) state.amountDirty = false;
      const s = suggestion();
      const hint = form.querySelector('#lAmount').closest('.field').querySelector('.hint');
      hint.textContent = s ? fmt('led.suggest', { calc: s.calc }, 'Suggested: {calc}') : t('led.amount.hint', 'Suggested from the helper’s rate. You can change it.');
      if (s && !state.amountDirty) { F.amount.value = s.amount; F.amount.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    ['workerId', 'type', 'attendanceKind'].forEach((n) => F[n].addEventListener('change', () => syncFormShape(true)));
    F.days.addEventListener('input', () => syncFormShape(false));
    F.amount.addEventListener('input', (ev) => { if (ev.isTrusted) state.amountDirty = true; });

    function resetFormDefaults() {
      F.date.value = UI.todayISO(); F.date.max = UI.todayISO();
      F.type.value = 'attendance'; F.attendanceKind.value = 'full'; F.days.value = '1'; state.amountDirty = false;
      syncFormShape(true);
    }

    const binder = UI.bindForm(form, V.SCHEMAS.ledger, {
      async onSubmit(v) {
        const payload = { workerId: v.workerId, type: v.type, date: v.date, amount: v.amount, note: v.note };
        if (v.type === 'attendance') { payload.attendanceKind = v.attendanceKind; if (v.attendanceKind !== 'extra') payload.days = v.days; }
        await Store.create('ledger', payload);
        UI.toast(t('led.addedToast', 'Entry added. It is pending until the helper confirms.'));
        const keepWorker = v.workerId;
        binder.reset(); resetFormDefaults(); F.workerId.value = keepWorker;
        await reload(); renderAll();
      }
    });

    /* ------------------------------ wiring ------------------------------ */
    ['fSearch', 'fWorker', 'fStatus', 'fType'].forEach((id) => $(id).addEventListener(id === 'fSearch' ? 'input' : 'change', () => { renderBalance(); renderList(); }));
    $('fClear').addEventListener('click', () => { ['fSearch', 'fWorker', 'fStatus', 'fType'].forEach((id) => { $(id).value = ''; }); renderBalance(); renderList(); });
    document.querySelectorAll('input[name="viewRole"]').forEach((r) => r.addEventListener('change', () => {
      state.role = r.value;
      try { localStorage.setItem('sk_role', state.role); } catch (e) { /* ignore */ }
      renderAll();
    }));

    await reload();
    fillFilterSelects();
    resetFormDefaults();
    const preset = new URLSearchParams(location.search).get('worker');
    if (preset && state.workers.some((w) => w.id === preset)) { $('fWorker').value = preset; F.workerId.value = preset; syncFormShape(true); }
    renderAll();

    document.addEventListener('sk:langchange', () => { fillFilterSelects(); syncFormShape(false); renderAll(); });
  });
})();
