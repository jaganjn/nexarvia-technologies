(() => {
  const visual = document.querySelector('[data-nx45-journey]');
  if (!visual) return;
  const steps = [...visual.querySelectorAll('.nx45-journey-grid article')];
  const line = visual.querySelector('.nx45-route-line span');
  const ring = visual.querySelector('.nx45-progress-ring');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  const activate = (next) => {
    index = next;
    steps.forEach((step, i) => step.classList.toggle('active', i === index));
    if (line) line.style.width = `${((index + 1) / steps.length) * 100}%`;
    if (ring) {
      ring.style.background = `radial-gradient(circle at center,#0b2749 55%,transparent 57%),conic-gradient(#28a7ff 0 ${((index + 1) / steps.length) * 100}%,#294464 0 100%)`;
      const value = ring.querySelector('b');
      if (value) value.textContent = String(index + 1).padStart(2, '0');
    }
  };
  steps.forEach((step, i) => {
    step.addEventListener('mouseenter', () => activate(i));
    step.addEventListener('focusin', () => activate(i));
    step.addEventListener('click', () => activate(i));
  });
  activate(0);
  if (!reduced) window.setInterval(() => activate((index + 1) % steps.length), 2400);
})();
