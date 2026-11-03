/** directory.html — searchable / filterable helper directory with transparent trust scores. */
(function () {
  'use strict';
  const I = window.SKI18N, UI = window.SKUI, R = window.SKRecords, V = window.SKValidate, h = UI.h, Store = window.SKStore;
  const { t, fmt } = I;

  document.addEventListener('DOMContentLoaded', async () => {
    I.init();
    UI.init();
    const $ = (id) => document.getElementById(id);
    let workers = [], entries = [];

    function fillControls() {
      const cat = $('dCategory').value, rating = $('dRating').value || '0', sort = $('dSort').value || 'trust';
      UI.fillSelect($('dCategory'), V.CONST.CATEGORIES.map((c) => ({ value: c, label: t('cat.' + c) })), { placeholder: t('dir.allCats', 'All types'), value: cat });
      UI.fillSelect($('dRating'), [{ value: '0', label: t('dir.anyRating', 'Any rating') }, { value: '4', label: t('dir.rating4', '4 and above') }, { value: '4.5', label: t('dir.rating45', '4.5 and above') }], { value: rating });
      UI.fillSelect($('dSort'), [
        { value: 'trust', label: t('dir.sortTrust', 'Trust score') }, { value: 'rating', label: t('dir.sortRating', 'Rating') },
        { value: 'exp', label: t('dir.sortExp', 'Experience') }, { value: 'rate', label: t('dir.sortRate', 'Rate (low to high)') }], { value: sort });
    }

    const dailyEquivalent = (w) => (w.rateType === 'daily' ? w.rate : w.rate / 30);

    function visible() {
      const q = $('dSearch').value.trim().toLowerCase(), cat = $('dCategory').value, minR = Number($('dRating').value) || 0, ver = $('dVerified').checked;
      const scored = workers.map((w) => ({ w, trust: R.trustScore(w, entries) }));
      const rows = scored.filter(({ w }) =>
        (!cat || w.category === cat) && (!ver || w.verified) && (!minR || (w.rating || 0) >= minR) &&
        (!q || [w.name, w.location, w.skills.join(' '), t('cat.' + w.category)].join(' ').toLowerCase().includes(q)));
      const sort = $('dSort').value;
      rows.sort((a, b) =>
        sort === 'rating' ? (b.w.rating || 0) - (a.w.rating || 0)
        : sort === 'exp' ? b.w.experienceYears - a.w.experienceYears
        : sort === 'rate' ? dailyEquivalent(a.w) - dailyEquivalent(b.w)
        : b.trust.score - a.trust.score);
      return rows;
    }

    function card({ w, trust }) {
      const p = trust.parts;
      return h('article', { class: 'worker-card' },
        h('div', { class: 'wc-head' },
          h('div', { class: 'avatar', 'aria-hidden': 'true' }, Array.from(w.name)[0]),
          h('div', {}, h('div', { class: 'wc-name' }, w.name), h('div', { class: 'wc-role' }, t('cat.' + w.category) + ' · ' + w.location))),
        h('div', { class: 'badge-row' },
          h('span', { class: 'badge ' + (w.verified ? 'badge-verified' : 'badge-unverified') }, (w.verified ? '✓ ' : '… ') + (w.verified ? t('badge.verified', 'Verified') : t('badge.pending', 'Verification pending'))),
          w.rating ? h('span', { class: 'badge' }, h('span', { class: 'stars', 'aria-hidden': 'true' }, '★'), ' ' + w.rating.toFixed(1) + ' (' + w.reviews + ')') : h('span', { class: 'badge' }, t('dir.notRated', 'Not rated yet'))),
        h('dl', { class: 'wc-meta' },
          h('div', {}, h('dt', {}, t('dir.experience', 'Experience')), h('dd', {}, w.experienceYears + ' ' + t('common.years', 'yrs'))),
          h('div', {}, h('dt', {}, t('dir.rate', 'Rate')), h('dd', {}, R.money(w.rate) + t(w.rateType === 'daily' ? 'common.perDay' : 'common.perMonth')))),
        h('div', { class: 'skill-tags' }, w.skills.map((s) => h('span', {}, s))),
        h('div', { class: 'trust-meter' },
          h('div', { class: 'trust-top' }, h('span', {}, t('dir.trust', 'Trust score') + ' · ' + t('dir.tier.' + trust.tier)), h('span', { class: 'trust-score' }, String(trust.score), h('small', {}, '/100'))),
          h('div', { class: 'trust-bar', 'data-tier': trust.tier, role: 'img', 'aria-label': t('dir.trust', 'Trust score') + ' ' + trust.score + '/100' }, h('i', { style: 'width:' + trust.score + '%' })),
          h('div', { class: 'trust-breakdown' },
            fmt('dir.breakdown', { v: p.verified, r: p.rating, e: p.experience, c: p.records }, 'ID {v} · rating {r} · experience {e} · records {c}'),
            h('br'), trust.reviewed ? fmt('dir.reviewedLine', { c: trust.confirmed, d: trust.disputed }, '{c} confirmed · {d} disputed') : t('dir.noReviewed', 'No ledger entries reviewed yet'))),
        h('div', { class: 'wc-actions' },
          h('a', { class: 'btn btn-primary btn-small', href: 'hire-household.html?worker=' + encodeURIComponent(w.id) }, t('dir.hireBtn', 'Hire')),
          h('a', { class: 'btn btn-ghost btn-small', href: 'ledger.html?worker=' + encodeURIComponent(w.id) }, t('dir.ledgerBtn', 'View ledger'))));
    }

    function render() {
      const rows = visible(), grid = $('workerGrid');
      grid.textContent = '';
      $('dirCount').textContent = fmt('dir.count', { n: rows.length }, '{n} helpers found');
      if (!rows.length) { grid.append(h('div', { class: 'empty-state', style: 'grid-column:1/-1' }, t('dir.none', 'No helpers match these filters.'))); return; }
      rows.forEach((r) => grid.append(card(r)));
    }

    ['dSearch'].forEach((id) => $(id).addEventListener('input', render));
    ['dCategory', 'dRating', 'dSort', 'dVerified'].forEach((id) => $(id).addEventListener('change', render));
    $('dClear').addEventListener('click', () => { $('dSearch').value = ''; $('dCategory').value = ''; $('dRating').value = '0'; $('dSort').value = 'trust'; $('dVerified').checked = false; render(); });

    workers = await Store.list('workers');
    entries = await Store.list('ledger');
    fillControls();
    render();
    document.addEventListener('sk:langchange', () => { fillControls(); render(); });
  });
})();
