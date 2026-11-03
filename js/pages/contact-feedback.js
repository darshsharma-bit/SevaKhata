/** contact-feedback.html — support tickets, platform feedback and verification issues. */
(function () {
  'use strict';
  const I = window.SKI18N, UI = window.SKUI, V = window.SKValidate, h = UI.h, Store = window.SKStore;
  const { t, fmt } = I;

  document.addEventListener('DOMContentLoaded', async () => {
    I.init();
    UI.init();
    const form = document.getElementById('supportForm');
    const F = form.elements;

    F.phone.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); });

    /* Fields that only make sense for one kind of message. */
    function syncKind() {
      const kind = (form.querySelector('input[name="kind"]:checked') || {}).value;
      document.getElementById('relatedField').hidden = kind !== 'verification';
      document.getElementById('ratingField').hidden = kind !== 'feedback';
    }
    form.querySelectorAll('input[name="kind"]').forEach((r) => r.addEventListener('change', syncKind));

    const counter = document.getElementById('msgCount');
    F.message.addEventListener('input', () => { counter.textContent = F.message.value.length + ' / 1000'; });

    async function fillWorkers() {
      const workers = await Store.list('workers');
      const prev = F.relatedWorkerId.value;
      UI.fillSelect(F.relatedWorkerId, workers.map((w) => ({ value: w.id, label: w.name })), { placeholder: t('sup.anyProfile', 'No specific profile'), value: prev });
    }

    const binder = UI.bindForm(form, V.SCHEMAS.feedback, {
      async onSubmit(v) {
        const payload = { kind: v.kind, name: v.name, email: v.email, phone: v.phone, subject: v.subject, message: v.message };
        if (v.kind === 'feedback') payload.rating = v.rating;
        if (v.kind === 'verification') payload.relatedWorkerId = F.relatedWorkerId.value;
        const { record, via } = await Store.create('feedback', payload);
        UI.successModal({
          title: t('sup.successTitle', 'Message sent'),
          lines: [fmt('sup.successLine', { name: record.name }, 'Thank you, {name}. Your message has been recorded.')],
          reference: record.id, via
        });
        const kind = v.kind;
        binder.reset(); form.querySelector('input[name="kind"][value="' + kind + '"]').checked = true;
        counter.textContent = '0 / 1000'; syncKind(); renderRecent();
      }
    });
    document.getElementById('sReset').addEventListener('click', () => setTimeout(() => { binder.reset(); counter.textContent = '0 / 1000'; syncKind(); }));

    /* Only subject, type, status and date are listed — never names, emails or phone numbers. */
    async function renderRecent() {
      const list = document.getElementById('recentFeedback');
      const items = (await Store.list('feedback')).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 5);
      list.textContent = '';
      if (!items.length) { list.append(h('li', { class: 'empty-state' }, t('sup.noneYet', 'No messages yet.'))); return; }
      const kindLabel = (k) => t('sup.kind' + k.charAt(0).toUpperCase() + k.slice(1), k);
      items.forEach((f) => list.append(h('li', { class: 'mini-item' },
        h('div', { class: 'mi-top' }, h('strong', {}, f.subject), h('span', { class: 'tag-open' }, kindLabel(f.kind))),
        h('span', {}, UI.formatDate(f.createdAt) + (f.rating ? ' · ' + '★'.repeat(f.rating) : '')))));
    }

    syncKind();
    await fillWorkers(); renderRecent();
    document.addEventListener('sk:langchange', () => { fillWorkers(); renderRecent(); });
  });
})();
