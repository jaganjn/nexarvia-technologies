(() => {
  'use strict';

  const html = document.documentElement;
  const root = document.querySelector('[data-nx48-journey]');
  if (!root) return;

  const scroller = root.querySelector('.nx48-steps');
  const steps = [...root.querySelectorAll('.nx48-steps button')];
  const progress = root.querySelector('.nx48-progress');
  const percent = root.querySelector('[data-nx48-percent]');
  const title = root.querySelector('[data-nx48-title]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!scroller || steps.length < 2) return;

  const isMobileMirror = () => html.classList.contains('nx-desktop-mirror-mode');
  let animationTimer = 0;
  let scrollTimer = 0;
  let lastActive = -1;

  const centreStep = (step, animate = true) => {
    if (!isMobileMirror() || !step) return;
    const targetLeft = Math.max(0, step.offsetLeft - (scroller.clientWidth - step.offsetWidth) / 2);
    scroller.scrollTo({
      left: targetLeft,
      behavior: animate && !reducedMotion.matches ? 'smooth' : 'auto'
    });
  };

  const animateActiveStep = (step, index, animate = true) => {
    if (!isMobileMirror() || !step) return;

    steps.forEach((item, itemIndex) => {
      item.setAttribute('aria-current', itemIndex === index ? 'step' : 'false');
      if (itemIndex !== index) item.classList.remove('nx54-entering');
    });

    step.classList.remove('nx54-entering');
    // Force a new animation cycle only on the newly activated mobile card.
    void step.offsetWidth;
    step.classList.add('nx54-entering');

    progress?.classList.add('nx54-updating');
    [percent, title].forEach(node => {
      if (!node) return;
      node.classList.remove('nx54-text-enter');
      void node.offsetWidth;
      node.classList.add('nx54-text-enter');
    });

    clearTimeout(animationTimer);
    animationTimer = window.setTimeout(() => {
      step.classList.remove('nx54-entering');
      progress?.classList.remove('nx54-updating');
      percent?.classList.remove('nx54-text-enter');
      title?.classList.remove('nx54-text-enter');
    }, 950);

    centreStep(step, animate);
  };

  const syncFromActiveClass = (animate = true) => {
    if (!isMobileMirror()) return;
    const index = steps.findIndex(step => step.classList.contains('active'));
    if (index < 0 || index === lastActive) return;
    lastActive = index;
    animateActiveStep(steps[index], index, animate);
  };

  // V48 already advances 01 → 02 → 03 → 04 → 05. We observe that existing
  // state change and move the mobile carousel to the matching card. Desktop is untouched.
  const observer = new MutationObserver(records => {
    if (!isMobileMirror()) return;
    if (records.some(record => record.attributeName === 'class')) syncFromActiveClass(true);
  });

  steps.forEach(step => observer.observe(step, { attributes: true, attributeFilter: ['class'] }));

  // Manual swiping updates the selected step after the gesture settles.
  const syncNearestAfterSwipe = () => {
    if (!isMobileMirror()) return;
    clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      const centre = scroller.scrollLeft + scroller.clientWidth / 2;
      let nearest = 0;
      let distance = Number.POSITIVE_INFINITY;
      steps.forEach((step, index) => {
        const stepCentre = step.offsetLeft + step.offsetWidth / 2;
        const nextDistance = Math.abs(stepCentre - centre);
        if (nextDistance < distance) {
          distance = nextDistance;
          nearest = index;
        }
      });
      if (!steps[nearest].classList.contains('active')) steps[nearest].click();
    }, 150);
  };

  scroller.addEventListener('scroll', syncNearestAfterSwipe, { passive: true });

  const refreshMode = () => {
    if (isMobileMirror()) {
      lastActive = -1;
      requestAnimationFrame(() => syncFromActiveClass(false));
    } else {
      // Do not write styles or classes on desktop. Restore only temporary V54 state.
      clearTimeout(animationTimer);
      clearTimeout(scrollTimer);
      steps.forEach(step => {
        step.classList.remove('nx54-entering');
        step.removeAttribute('aria-current');
      });
      progress?.classList.remove('nx54-updating');
      percent?.classList.remove('nx54-text-enter');
      title?.classList.remove('nx54-text-enter');
      lastActive = -1;
    }
  };

  refreshMode();
  window.addEventListener('orientationchange', () => setTimeout(refreshMode, 120), { passive: true });
  window.addEventListener('resize', refreshMode, { passive: true });
})();
