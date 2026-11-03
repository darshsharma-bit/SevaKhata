/**
 * SevaKhata — shared UI helpers: DOM builder, toast, modal, mobile nav,
 * sync badge, export buttons and the real-time form validation binder.
 */
(function () {
  'use strict';
  const V = window.SKValidate;
  const I = window.SKI18N;
  const R = window.SKRecords;
  const UI = {};

  /* --------------------------------- DOM helper --------------------------------- */
  UI.h = function (tag, attrs, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v === false || v == null) return;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
    children.flat().forEach((c) => { if (c != null && c !== false) node.append(c.nodeType ? c : document.createTextNode(c)); });
    return node;
  };
  const h = UI.h;

  UI.fillSelect = function (select, items, { placeholder, value } = {}) {
    select.textContent = '';
    if (placeholder !== undefined) select.append(h('option', { value: '', text: placeholder }));
    items.forEach((it) => select.append(h('option', { value: it.value }, it.label)));
    if (value !== undefined) select.value = value;
  };

  /* ----------------------------------- toast ----------------------------------- */
  UI.toast = function (message, type = 'success') {
    let region = document.getElementById('toastRegion');
    if (!region) {
      region = h('div', { id: 'toastRegion', class: 'toast-region', 'aria-live': 'polite', 'aria-atomic': 'false' });
      document.body.append(region);
    }
    const icon = type === 'success' ? '✓' : type === 'error' ? '!' : 'i';
    const node = h('div', { class: 'toast toast-' + type, role: type === 'error' ? 'alert' : 'status' },
      h('span', { class: 'toast-icon', 'aria-hidden': 'true' }, icon), h('span', { class: 'toast-msg' }, message));
    region.append(node);
    requestAnimationFrame(() => node.classList.add('is-in'));
    setTimeout(() => { node.classList.remove('is-in'); setTimeout(() => node.remove(), 300); }, 4200);
  };

  /* ----------------------------------- modal ----------------------------------- */
  UI.modal = function ({ title, body, actions = [], onClose, tone = '' }) {
    const previouslyFocused = document.activeElement;
    const close = () => {
      document.removeEventListener('keydown', onKey);
      overlay.classList.remove('is-in');
      setTimeout(() => overlay.remove(), 200);
      document.body.classList.remove('modal-open');
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
      if (onClose) onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {                           // keep focus inside the dialog
        const f = dialog.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    const titleId = 'modalTitle' + Date.now();
    const dialog = h('div', { class: 'modal-dialog ' + tone, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId },
      h('h2', { id: titleId, class: 'modal-title' }, title),
      h('div', { class: 'modal-body' }, body),
      h('div', { class: 'modal-actions' }, actions.map((a) =>
        h('button', { type: 'button', class: 'btn ' + (a.primary ? 'btn-primary' : 'btn-ghost'), onclick: () => { if (a.onClick) { if (a.onClick(close) === false) return; } if (a.close !== false) close(); } }, a.label))));
    const overlay = h('div', { class: 'modal-overlay', onclick: (e) => { if (e.target === overlay) close(); } }, dialog);
    document.body.append(overlay);
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => { overlay.classList.add('is-in'); const f = dialog.querySelector('input,textarea,select,button.btn-primary,button'); if (f) f.focus(); });
    return { close, dialog };
  };

  /** Success dialog used after every form submission. */
  UI.successModal = function ({ title, lines, reference, via, actions }) {
    const body = h('div', { class: 'success-body' },
      h('p', { class: 'success-lead' }, ...(lines || [])),
      reference ? h('p', { class: 'success-ref' }, I.t('common.reference', 'Reference'), ': ', h('code', {}, reference)) : null,
      h('p', { class: 'success-via' }, via === 'server'
        ? I.t('common.savedServer', 'Saved to the JSON file on the server.')
        : I.t('common.savedLocal', 'Server not running, so this was saved in your browser. Use “Export JSON” to download the file.')));
    return UI.modal({ title, body, tone: 'modal-success', actions: actions || [{ label: I.t('common.close', 'Close'), primary: true }] });
  };

  /* ----------------------------- nav, sync badge, export ----------------------------- */
  UI.initNav = function () {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!toggle || !links) return;
    const setOpen = (open) => { links.classList.toggle('is-open', open); toggle.setAttribute('aria-expanded', String(open)); };
    toggle.addEventListener('click', () => setOpen(!links.classList.contains('is-open')));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    links.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('click', (e) => { if (!e.target.closest('.system-nav')) setOpen(false); });
  };

  UI.initSyncBadge = function () {
    const badges = document.querySelectorAll('[data-sync-status]');
    if (!badges.length || !window.SKStore) return;
    const paint = () => {
      const mode = window.SKStore.mode;
      badges.forEach((b) => {
        b.dataset.mode = mode;
        b.textContent = mode === 'server' ? I.t('sync.server', 'Live server · saving to data/*.json')
          : mode === 'offline' ? I.t('sync.offline', 'Offline demo · saving in this browser')
          : I.t('sync.checking', 'Checking server…');
      });
    };
    window.SKStore.onModeChange(paint);
    document.addEventListener('sk:langchange', paint);
    paint();
    window.SKStore.detect().then(paint);
  };

  UI.initExportButtons = function () {
    document.querySelectorAll('[data-export]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const resource = btn.dataset.export;
        try {
          const n = await window.SKStore.exportJson(resource);
          UI.toast(I.t('common.exported', 'Downloaded {file} ({n} records).').replace('{file}', resource + '.json').replace('{n}', n));
        } catch (e) { UI.toast(I.t('common.exportFail', 'Could not export the file.'), 'error'); }
      });
    });
  };

  /* ------------------------------ form validation binder ------------------------------ */
  function controlsOf(form, name) { return Array.from(form.querySelectorAll('[name="' + name + '"]')); }

  function readValues(form, schema) {
    const out = {};
    Object.keys(schema).concat(Array.from(form.elements).map((el) => el.name).filter(Boolean)).forEach((name) => {
      if (name in out) return;
      const ctrls = controlsOf(form, name);
      if (!ctrls.length) return;
      const first = ctrls[0];
      if (first.type === 'checkbox') out[name] = first.checked;
      else if (first.type === 'radio') { const on = ctrls.find((c) => c.checked); out[name] = on ? on.value : ''; }
      else out[name] = typeof first.value === 'string' ? first.value.trim() : first.value;
    });
    return out;
  }

  /**
   * @param form    HTMLFormElement (use novalidate so our messages replace native popups)
   * @param schema  SKValidate schema
   * @param opts    { onSubmit(values, api) }  - may throw SKStore.ApiError to show server-side field errors
   */
  UI.bindForm = function (form, schema, opts = {}) {
    const touched = new Set();
    const idBase = form.id || 'form' + Math.random().toString(36).slice(2, 6);

    function errorBox(name) {
      const ctrls = controlsOf(form, name);
      if (!ctrls.length) return null;
      const field = ctrls[0].closest('.field') || ctrls[0].parentElement;
      let box = field.querySelector('.field-error');
      if (!box) { box = h('p', { class: 'field-error', 'aria-live': 'polite' }); field.append(box); }
      box.id = box.id || `err-${idBase}-${name}`;
      return box;
    }

    function paint(name, message) {
      const ctrls = controlsOf(form, name);
      if (!ctrls.length) return;
      const box = errorBox(name);
      const field = ctrls[0].closest('.field');
      const hasValue = ctrls.some((c) => (c.type === 'checkbox' || c.type === 'radio' ? c.checked : String(c.value).trim() !== ''));
      ctrls.forEach((c) => {
        c.classList.toggle('is-invalid', !!message);
        c.classList.toggle('is-valid', !message && hasValue);
        c.setAttribute('aria-invalid', message ? 'true' : 'false');
        if (message) c.setAttribute('aria-describedby', box.id); else c.removeAttribute('aria-describedby');
      });
      if (field) { field.classList.toggle('has-error', !!message); field.classList.toggle('has-success', !message && hasValue); }
      box.textContent = message || '';
    }

    function checkField(name) {
      const values = readValues(form, schema);
      const err = V.validateField(schema, name, values[name], values);
      paint(name, err ? I.msg(err) : '');
      return err;
    }

    function checkTouched() { touched.forEach((n) => checkField(n)); }

    Object.keys(schema).forEach((name) => {
      controlsOf(form, name).forEach((c) => {
        c.addEventListener('blur', () => { touched.add(name); checkField(name); });
        const live = () => { if (touched.has(name) || c.classList.contains('is-invalid')) { touched.add(name); checkField(name); } checkTouched(); };
        c.addEventListener('input', live);
        c.addEventListener('change', live);
      });
    });
    document.addEventListener('sk:langchange', checkTouched);   // re-translate visible messages

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const values = readValues(form, schema);
      const { valid, errors } = V.validate(schema, values);
      Object.keys(schema).forEach((n) => touched.add(n));
      Object.keys(schema).forEach((n) => paint(n, errors[n] ? I.msg(errors[n]) : ''));
      if (!valid) {
        const firstName = Object.keys(schema).find((n) => errors[n]);
        const ctrl = controlsOf(form, firstName)[0];
        if (ctrl) ctrl.focus();
        UI.toast(I.t('common.fixErrors', 'Please fix the highlighted fields.'), 'error');
        return;
      }
      const submitBtn = form.querySelector('[type="submit"]');
      const setBusy = (busy) => { if (submitBtn) { submitBtn.disabled = busy; submitBtn.classList.toggle('is-busy', busy); } };
      setBusy(true);
      try {
        await opts.onSubmit(values, { setBusy });
      } catch (err) {
        if (err && err.errors && Object.keys(err.errors).length) {
          Object.entries(err.errors).forEach(([n, m]) => paint(n, typeof m === 'string' ? m : I.msg(m)));
          UI.toast(I.t('common.fixErrors', 'Please fix the highlighted fields.'), 'error');
        } else {
          UI.toast((err && err.message) || I.t('common.error', 'Something went wrong. Please try again.'), 'error');
        }
      } finally { setBusy(false); }
    });

    return {
      reset() {
        form.reset(); touched.clear();
        Object.keys(schema).forEach((n) => paint(n, ''));
        form.querySelectorAll('.is-valid,.is-invalid').forEach((c) => c.classList.remove('is-valid', 'is-invalid'));
        form.querySelectorAll('.has-success,.has-error').forEach((c) => c.classList.remove('has-success', 'has-error'));
      },
      values: () => readValues(form, schema),
      recheck: checkTouched
    };
  };

  /* ------------------------------ small shared renderers ------------------------------ */
  UI.statusPill = function (status) {
    return h('span', { class: 'semantic-state-pill ' + status },
      h('span', { class: 'pill-dot', 'aria-hidden': 'true' }), h('span', { 'data-live-i18n': 'status.' + status }, I.t('status.' + status, status)));
  };
  UI.money = R.money;

  UI.todayISO = function () { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  UI.formatDate = function (iso) {
    if (!iso) return '';
    const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
    return d.toLocaleDateString(I.lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  /** Fill every <select data-fill="..."> with translated options; re-run on language change. */
  UI.fillSelects = function () {
    const C = V.CONST;
    const sets = {
      categories: () => C.CATEGORIES.map((c) => ({ value: c, label: I.t('cat.' + c) })),
      idTypes: () => C.ID_TYPES.map((c) => ({ value: c, label: I.t('id.' + c) })),
      ledgerTypes: () => C.LEDGER_TYPES.map((c) => ({ value: c, label: I.t('type.' + c) })),
      attendanceKinds: () => C.ATTENDANCE_KINDS.map((c) => ({ value: c, label: I.t('att.' + c) }))
    };
    document.querySelectorAll('select[data-fill]').forEach((sel) => {
      const prev = sel.value;
      const placeholder = sel.dataset.fill === 'attendanceKinds' ? undefined : I.t('common.select');
      UI.fillSelect(sel, sets[sel.dataset.fill](), { placeholder, value: prev });
      if (!prev && sel.dataset.fill === 'attendanceKinds') sel.value = 'full';
    });
  };

  UI.init = function () {
    UI.initNav();
    UI.initSyncBadge();
    UI.initExportButtons();
    UI.fillSelects();
    document.addEventListener('sk:langchange', UI.fillSelects);
  };

  window.SKUI = UI;
})();
