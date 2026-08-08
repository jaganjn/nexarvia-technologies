(() => {
  const init = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileMq = window.matchMedia('(max-width:820px)');

    function makeCarousel(sectionSelector, trackSelector, options = {}) {
      const section = document.querySelector(sectionSelector);
      const track = section?.querySelector(trackSelector);
      if (!section || !track || track.dataset.nx53Ready) return null;
      const slides = [...track.children];
      if (slides.length < 2) return null;
      track.dataset.nx53Ready = '1';

      track.classList.add('nx52-track');
      slides.forEach((slide, i) => {
        slide.classList.add('nx52-slide');
        slide.dataset.nx53Index = i;
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
        btn.addEventListener('click', () => {
          stop();
          go(i, true);
        });
        dotsWrap.appendChild(btn);
        return btn;
      });
      nav.append(dotsWrap, progress);
      viewport.after(nav);

      let index = 0;
      let timer = null;
      let dragging = false;
      let moved = false;
      let startX = 0;
      let deltaX = 0;
      const HOLD = options.hold || 2150;

      const clearTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };
      const maxTranslate = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      const targetFor = (i) => {
        const slide = slides[i];
        if (!slide) return 0;
        const centered = slide.offsetLeft - ((viewport.clientWidth - slide.clientWidth) / 2);
        return Math.max(0, Math.min(centered, maxTranslate()));
      };
      const resetBar = () => {
        const bar = progress.querySelector('i');
        if (!bar) return;
        bar.style.animation = 'none';
        void bar.offsetWidth;
        bar.style.animation = '';
      };
      const schedule = () => {
        clearTimer();
        if (reduce || !mobileMq.matches || document.hidden) return;
        nav.classList.remove('is-paused');
        nav.classList.add('is-running');
        resetBar();
        timer = setTimeout(() => go(index + 1, false), HOLD);
      };
      const stop = () => {
        clearTimer();
        nav.classList.remove('is-running');
        nav.classList.add('is-paused');
      };
      const updateStates = () => {
        slides.forEach((slide, i) => {
          slide.classList.toggle('is-active', i === index);
          slide.classList.toggle('is-next', i === ((index + 1) % slides.length));
          slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
        });
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
      };
      const render = (animate = true) => {
        if (!mobileMq.matches) {
          stop();
          track.style.transform = 'none';
          track.style.transition = 'none';
          slides.forEach(slide => slide.classList.remove('is-active', 'is-next'));
          dots.forEach(dot => dot.classList.remove('is-active'));
          return;
        }
        track.style.transition = animate ? 'transform .56s cubic-bezier(.2,.78,.22,1)' : 'none';
        track.style.transform = `translate3d(${-targetFor(index)}px,0,0)`;
        updateStates();
        if (!animate) {
          void track.offsetWidth;
          track.style.transition = '';
        }
        schedule();
      };
      const go = (nextIndex) => {
        index = (nextIndex + slides.length) % slides.length;
        render(true);
      };

      viewport.addEventListener('pointerdown', (e) => {
        if (!mobileMq.matches) return;
        dragging = true;
        moved = false;
        startX = e.clientX;
        deltaX = 0;
        stop();
        viewport.setPointerCapture?.(e.pointerId);
        track.style.transition = 'none';
      });
      viewport.addEventListener('pointermove', (e) => {
        if (!dragging || !mobileMq.matches) return;
        deltaX = e.clientX - startX;
        if (Math.abs(deltaX) > 10) moved = true;
        const translate = -targetFor(index) + deltaX;
        const clamped = Math.max(-maxTranslate() - 26, Math.min(26, translate));
        track.style.transform = `translate3d(${clamped}px,0,0)`;
      });
      const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        if (Math.abs(deltaX) > 42) {
          go(index + (deltaX < 0 ? 1 : -1));
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

    makeCarousel('#principles', '#principles .nx47-grid');
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init, { once: true })
    : init();
})();
