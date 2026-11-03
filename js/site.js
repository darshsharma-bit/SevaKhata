/** index.html — wires the shared navigation (language toggle + mobile menu) on the landing page. */
document.addEventListener('DOMContentLoaded', () => {
  window.SKI18N.init();
  window.SKUI.initNav();
});
