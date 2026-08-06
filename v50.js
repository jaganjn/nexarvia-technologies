'use strict';
(function () {
  const zone = document.querySelector('.application-zone');
  if (!zone) return;

  const reveal = () => zone.classList.add('nx50-visible');
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveal();
  } else {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      reveal();
      observer.disconnect();
    }, { threshold: 0.12 });
    observer.observe(zone);
  }

  const card = document.getElementById('apply');
  const form = document.getElementById('internshipForm');
  form?.addEventListener('focusin', () => card?.classList.add('nx50-form-active'));
  form?.addEventListener('focusout', event => {
    if (!form.contains(event.relatedTarget)) card?.classList.remove('nx50-form-active');
  });
})();
