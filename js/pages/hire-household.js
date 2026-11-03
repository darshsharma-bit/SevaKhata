/** hire-household.html — browse categories, send a hiring request / log an arrangement. */
(function () {
  'use strict';
  const I = window.SKI18N, UI = window.SKUI, R = window.SKRecords, V = window.SKValidate, h = UI.h, Store = window.SKStore;
  const { t, fmt } = I;

  document.addEventListener('DOMContentLoaded', async () => {
    I.init();
    UI.init();

    const form = document.getElementById('hireForm');
    const catSelect = form.elements.category;
    const workerSelect = form.elements.workerId;
    let workers = [], selectedCat = '';

    form.elements.phone.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); });

    const binder = UI.bindForm(form, V.SCHEMAS.booking, {
      async onSubmit(v) {
        const { record, via } = await Store.create('bookings', v);
        UI.successModal({
          title: t('hire.successTitle', 'Request sent'),
          lines: [fmt('hire.successLine', { house: record.householdName }, 'Your request for {house} has been recorded.')],
          reference: record.id, via,
          actions: [
            { label: t('hire.toLedger', 'Open the shared ledger →'), onClick: () => { location.href = 'ledger.html'; }, close: false },
            { label: t('common.close', 'Close'), primary: true }
          ]
        });
        binder.reset(); selectedCat = ''; paintTiles(); paintMatches(); fillWorkers();
        renderBookings();
      }
    });
    document.getElementById('hReset').addEventListener('click', () => setTimeout(() => { binder.reset(); selectedCat = ''; paintTiles(); paintMatches(); fillWorkers(); }));

    /* ---------------- category tiles + matching helpers ---------------- */
    function paintTiles() {
      const grid = document.getElementById('categoryGrid');
      grid.textContent = '';
      V.CONST.CATEGORIES.forEach((c) => {
        const n = workers.filter((w) => w.category === c).length;
        grid.append(h('button', { type: 'button', class: 'category-tile', 'aria-pressed': String(selectedCat === c), onclick: () => chooseCategory(selectedCat === c ? '' : c) },
          h('span', { class: 'ct-name' }, t('cat.' + c)),
          h('span', { class: 'ct-hi', lang: 'hi' }, I.HI['cat.' + c]),
          h('span', { class: 'ct-count' }, n + ' ' + (I.lang === 'hi' ? 'सहायक' : (n === 1 ? 'helper' : 'helpers')))));
      });
    }

    function paintMatches() {
      const list = document.getElementById('matchList');
      list.textContent = '';
      if (!selectedCat) return;
      const matches = workers.filter((w) => w.category === selectedCat);
      list.append(h('li', { class: 'panel-sub', style: 'margin:0' }, fmt('hire.helpersIn', { cat: t('cat.' + selectedCat) }, 'Helpers: {cat}')));
      if (!matches.length) { list.append(h('li', { class: 'empty-state' }, t('hire.noneIn', 'No helpers in this category yet.'))); return; }
      matches.forEach((w) => list.append(h('li', { class: 'mini-item' },
        h('div', { class: 'mi-top' }, h('strong', {}, w.name),
          h('button', { type: 'button', class: 'btn btn-ghost btn-small', onclick: () => pickWorker(w) }, t('common.hire', 'Hire'))),
        h('span', {}, w.location + ' · ' + R.money(w.rate) + t(w.rateType === 'daily' ? 'common.perDay' : 'common.perMonth') + ' · ' + w.experienceYears + ' ' + t('common.years', 'yrs')))));
    }

    function chooseCategory(c) {
      selectedCat = c;
      catSelect.value = c;
      catSelect.dispatchEvent(new Event('change', { bubbles: true }));
      paintTiles(); paintMatches(); fillWorkers();
    }

    function pickWorker(w) {
      selectedCat = w.category; catSelect.value = w.category;
      paintTiles(); paintMatches(); fillWorkers(); workerSelect.value = w.id;
      workerSelect.dispatchEvent(new Event('change', { bubbles: true }));
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      form.elements.householdName.focus({ preventScroll: true });
    }

    /* Helper dropdown follows the chosen category. */
    function fillWorkers() {
      const prev = workerSelect.value;
      const cat = catSelect.value;
      const pool = workers.filter((w) => !cat || w.category === cat);
      UI.fillSelect(workerSelect, pool.map((w) => ({ value: w.id, label: w.name + ' · ' + t('cat.' + w.category) })), { placeholder: t('hire.pickWorker', 'Any / decide later') });
      workerSelect.value = pool.some((w) => w.id === prev) ? prev : '';
    }
    catSelect.addEventListener('change', () => { selectedCat = catSelect.value; paintTiles(); paintMatches(); fillWorkers(); });

    /* ---------------- recent requests ---------------- */
    async function renderBookings() {
      const list = document.getElementById('recentBookings');
      const items = (await Store.list('bookings')).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 5);
      list.textContent = '';
      if (!items.length) { list.append(h('li', { class: 'empty-state' }, t('hire.noRequests', 'No requests yet.'))); return; }
      items.forEach((b) => list.append(h('li', { class: 'mini-item' },
        h('div', { class: 'mi-top' }, h('strong', {}, b.householdName), h('span', { class: 'tag-open' }, b.requestKind === 'existing' ? t('hire.existingTag', 'Existing') : t('hire.newTag', 'New request'))),
        h('span', {}, t('cat.' + b.category, b.category) + (b.workerName ? ' · ' + b.workerName : '') + ' · ' + b.location + ' · ' + UI.formatDate(b.startDate)))));
    }

    workers = await Store.list('workers');
    paintTiles(); fillWorkers(); renderBookings();

    // Pre-fill from links such as hire-household.html?worker=w-1001 or ?category=cook
    const q = new URLSearchParams(location.search);
    const w = workers.find((x) => x.id === q.get('worker'));
    if (w) pickWorker(w);
    else if (V.CONST.CATEGORIES.includes(q.get('category'))) chooseCategory(q.get('category'));

    document.addEventListener('sk:langchange', () => { paintTiles(); paintMatches(); fillWorkers(); renderBookings(); });
  });
})();
