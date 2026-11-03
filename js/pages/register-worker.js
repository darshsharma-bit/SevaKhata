/** register-worker.html — worker onboarding form (validation, save, recent list). */
(function () {
  'use strict';
  const { t, fmt } = window.SKI18N;
  const I = window.SKI18N, UI = window.SKUI, h = UI.h, Store = window.SKStore;

  document.addEventListener('DOMContentLoaded', () => {
    I.init();
    UI.init();

    const form = document.getElementById('workerForm');
    form.elements.idType.value = 'aadhaar';

    // Keep the phone field digits-only as the user types.
    form.elements.phone.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); });
    form.elements.idType.addEventListener('change', () => { form.elements.idNumber.value = ''; });

    const binder = UI.bindForm(form, window.SKValidate.SCHEMAS.workerForm, {
      async onSubmit(v) {
        const payload = {
          name: v.name, phone: v.phone, email: v.email, category: v.category, skills: v.skills,
          experienceYears: v.experienceYears, location: v.location, rateType: v.rateType, rate: v.rate,
          idType: v.idType, about: v.about,
          // Privacy: the full ID number never leaves the browser. Only the last 4 characters are sent and stored.
          idLast4: String(v.idNumber).replace(/\s+/g, '').toUpperCase().slice(-4)
        };
        const { record, via } = await Store.create('workers', payload);
        UI.successModal({
          title: t('reg.successTitle', 'Profile created'),
          lines: [fmt('reg.successLine', { name: record.name }, '{name}, your profile has been created. It is marked “verification pending”.')],
          reference: record.id, via,
          actions: [
            { label: t('reg.viewDir', 'View in directory'), onClick: () => { location.href = 'directory.html'; }, close: false },
            { label: t('reg.another', 'Register another'), primary: true }
          ]
        });
        binder.reset();
        form.elements.idType.value = 'aadhaar';
        renderRecent();
      }
    });
    document.getElementById('wReset').addEventListener('click', () => setTimeout(() => { binder.reset(); form.elements.idType.value = 'aadhaar'; }));

    async function renderRecent() {
      const list = document.getElementById('recentWorkers');
      const workers = (await Store.list('workers')).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 4);
      list.textContent = '';
      if (!workers.length) { list.append(h('li', { class: 'empty-state' }, t('reg.noneYet', 'No registrations yet.'))); return; }
      workers.forEach((w) => list.append(h('li', { class: 'mini-item' },
        h('div', { class: 'mi-top' }, h('strong', {}, w.name), h('span', { class: w.verified ? 'badge badge-verified' : 'badge badge-unverified' }, w.verified ? t('badge.verified', 'Verified') : t('badge.pending', 'Verification pending'))),
        h('span', {}, t('cat.' + w.category, w.category) + ' · ' + w.location))));
    }
    renderRecent();
    document.addEventListener('sk:langchange', renderRecent);
  });
})();
