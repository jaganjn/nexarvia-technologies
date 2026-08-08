(() => {
const ready = () => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileMq = window.matchMedia('(max-width:820px)');

  // Keep the top path indicator clean and aligned with the 2-second rhythm.
  const heroAuto = document.querySelector('.nx47-auto');
  if (heroAuto) {
    heroAuto.classList.add('nx50-auto-indicator');
    const spans = heroAuto.querySelectorAll('span');
    if (spans[0]) spans[0].textContent = 'Auto-switching every 2s';
  }

  // Give the path cards real emoji too.
  const setText = (selector, text) => { const el = document.querySelector(selector); if (el) el.textContent = text; };
  setText('.nx47-path--learning .nx47-icon', '🎓');
  setText('.nx47-path--services .nx47-icon', '💼');
  const heroFeatureMap = {
    '.nx47-path--learning .nx47-feature:nth-child(1) i':'🎯',
    '.nx47-path--learning .nx47-feature:nth-child(2) i':'🧭',
    '.nx47-path--learning .nx47-feature:nth-child(3) i':'🛠️',
    '.nx47-path--learning .nx47-feature:nth-child(4) i':'📈',
    '.nx47-path--learning .nx47-feature:nth-child(5) i':'🏆',
    '.nx47-path--learning .nx47-feature:nth-child(6) i':'🚀',
    '.nx47-path--services .nx47-feature:nth-child(1) i':'💻',
    '.nx47-path--services .nx47-feature:nth-child(2) i':'🗂️',
    '.nx47-path--services .nx47-feature:nth-child(3) i':'⚙️',
    '.nx47-path--services .nx47-feature:nth-child(4) i':'🔄',
    '.nx47-path--services .nx47-feature:nth-child(5) i':'🧠',
    '.nx47-path--services .nx47-feature:nth-child(6) i':'📣'
  };
  Object.entries(heroFeatureMap).forEach(([sel,txt])=>setText(sel,txt));

  // Approach specific emoji (kept small and contextual).
  const stepEmojis = ['🔎','🧭','🛠️','📈'];
  document.querySelectorAll('#approach .nx47-step').forEach((step,i)=>{
    if (step.querySelector('.nx52-step-emoji')) return;
    const span = document.createElement('span');
    span.className = 'nx52-step-emoji';
    span.setAttribute('aria-hidden','true');
    span.textContent = stepEmojis[i] || '✨';
    step.appendChild(span);
  });

  // Mission/Vision shooting star lane in the center.
  const mv = document.querySelector('#mission .nx47-mv');
  if (mv && !mv.querySelector('.nx52-star-lane')) {
    const lane = document.createElement('div');
    lane.className = 'nx52-star-lane';
    lane.setAttribute('aria-hidden','true');
    lane.innerHTML = '<span class="nx52-shooting-star"></span>';
    const second = mv.children[1];
    if (second) mv.insertBefore(lane, second);
    else mv.appendChild(lane);
  }

  function makeCarousel(sectionSelector, trackSelector, opts = {}) {
    const section = document.querySelector(sectionSelector);
    const track = section?.querySelector(trackSelector);
    if (!section || !track || track.dataset.nx52Ready) return null;
    track.dataset.nx52Ready = '1';
    const slides = [...track.children];
    if (slides.length < 2) return null;

    track.classList.add('nx52-track');
    slides.forEach((slide, i) => {
      slide.classList.add('nx52-slide');
      slide.dataset.nx52Index = i;
    });

    const viewport = document.createElement('div');
    viewport.className = 'nx52-viewport';
    track.parentNode.insertBefore(viewport, track);
    viewport.appendChild(track);

    const nav = document.createElement('div');
    nav.className = 'nx52-nav';
    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'nx52-dots';
    const progress = document.createElement('span');
    progress.className = 'nx52-progress';
    progress.innerHTML = '<i></i>';
    const dots = slides.map((_, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nx52-dot';
      btn.setAttribute('aria-label', `Show item ${i + 1}`);
      btn.addEventListener('click', () => { stop(); go(i, true); });
      dotsWrap.appendChild(btn);
      return btn;
    });
    nav.appendChild(dotsWrap);
    nav.appendChild(progress);
    viewport.after(nav);

    let index = 0;
    let holdTimer = null;
    let startX = 0;
    let deltaX = 0;
    let dragging = false;
    let moved = false;

    const HOLD = opts.hold || 2150;
    const SHIFT = opts.shift || 560;

    const clearTimers = () => { clearTimeout(holdTimer); holdTimer = null; };
    const maxTranslate = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    const targetFor = (i) => {
      const slide = slides[i];
      if (!slide) return 0;
      const centered = slide.offsetLeft - ((viewport.clientWidth - slide.clientWidth) / 2);
      return Math.max(0, Math.min(centered, maxTranslate()));
    };
    const resetProgress = () => {
      const bar = progress.querySelector('i');
      if (!bar) return;
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.animation = '';
    };
    const updateActive = () => {
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === index);
        slide.classList.toggle('is-next', i === ((index + 1) % slides.length));
        slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
      });
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    };
    const render = (animate = true) => {
      if (!mobileMq.matches) {
        clearTimers();
        nav.classList.remove('is-running','is-paused');
        track.style.transform = 'none';
        track.style.transition = 'none';
        slides.forEach(s => s.classList.remove('is-active','is-next'));
        dots.forEach(d => d.classList.remove('is-active'));
        return;
      }
      if (!animate) track.style.transition = 'none';
      else track.style.transition = `transform ${SHIFT}ms var(--nx52-ease)`;
      track.style.transform = `translate3d(${-targetFor(index)}px,0,0)`;
      updateActive();
      if (!animate) { void track.offsetWidth; track.style.transition = ''; }
      schedule();
    };
    const schedule = () => {
      clearTimers();
      if (reduce || !mobileMq.matches || document.hidden) return;
      nav.classList.remove('is-paused');
      nav.classList.add('is-running');
      resetProgress();
      holdTimer = setTimeout(() => go(index + 1, false), HOLD);
    };
    const stop = () => {
      clearTimers();
      nav.classList.remove('is-running');
      nav.classList.add('is-paused');
    };
    const go = (target, user = false) => {
      index = (target + slides.length) % slides.length;
      render(true);
      if (user) viewport.classList.add('nx52-user-touched');
    };

    viewport.addEventListener('pointerdown', (e) => {
      if (!mobileMq.matches) return;
      dragging = true; moved = false; startX = e.clientX; deltaX = 0; stop();
      viewport.setPointerCapture?.(e.pointerId);
      track.style.transition = 'none';
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!dragging || !mobileMq.matches) return;
      deltaX = e.clientX - startX;
      if (Math.abs(deltaX) > 12) moved = true;
      const translate = -targetFor(index) + deltaX;
      const clamped = Math.max(-maxTranslate() - 24, Math.min(24, translate));
      track.style.transform = `translate3d(${clamped}px,0,0)`;
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(deltaX) > 44) {
        go(index + (deltaX < 0 ? 1 : -1), true);
      } else {
        render(true);
      }
      deltaX = 0;
    };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    slides.forEach(slide => slide.addEventListener('click', (e) => { if (moved) e.preventDefault(); }));

    document.addEventListener('visibilitychange', () => document.hidden ? stop() : schedule());
    window.addEventListener('resize', () => render(false), { passive: true });
    mobileMq.addEventListener?.('change', () => render(false));
    render(false);

    return { render, stop };
  }

  makeCarousel('#capabilities', '#capabilities .nx47-grid');
  makeCarousel('#approach', '#approach .nx47-approach');
  makeCarousel('#audience', '#audience .nx47-audience');
};

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', ready, { once: true })
  : ready();
})();
