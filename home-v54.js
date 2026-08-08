(() => {
  const ready = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileMq = window.matchMedia('(max-width:820px)');
    const HOLD = 2000;
    const SHIFT = 650;
    const sections = [
      ['#capabilities', '.nx47-grid'],
      ['#principles', '.nx47-grid'],
      ['#approach', '.nx47-approach'],
      ['#audience', '.nx47-audience']
    ];

    const unwrapExisting = (section, track) => {
      const oldViewport = track.closest('.nx52-viewport');
      if (oldViewport && oldViewport.parentNode) {
        const parent = oldViewport.parentNode;
        parent.insertBefore(track, oldViewport);
        oldViewport.remove();
        const oldNav = parent.querySelector(':scope > .nx52-nav');
        if (oldNav) oldNav.remove();
      }
      section.querySelectorAll(':scope .nx52-nav').forEach(n => n.remove());
      track.classList.remove('nx52-track');
      track.style.removeProperty('transform');
      track.style.removeProperty('transition');
      track.dataset.nx54Ready = '';
    };

    const makeCarousel = (sectionSelector, trackSelector) => {
      const section = document.querySelector(sectionSelector);
      let track = section?.querySelector(trackSelector);
      if (!section || !track) return;
      unwrapExisting(section, track);
      if (track.dataset.nx54Ready === '1') return;
      const originalSlides = [...track.children];
      if (originalSlides.length < 2) return;
      track.dataset.nx54Ready = '1';

      track.classList.add('nx54-track');
      originalSlides.forEach((slide, i) => {
        slide.classList.add('nx54-slide');
        slide.dataset.nx54Index = i;
        slide.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      });

      // Clone the first slide so the final -> first transition remains visually continuous.
      const firstClone = originalSlides[0].cloneNode(true);
      firstClone.classList.add('nx54-clone');
      firstClone.setAttribute('aria-hidden', 'true');
      track.appendChild(firstClone);
      const slides = [...originalSlides, firstClone];

      const viewport = document.createElement('div');
      viewport.className = 'nx54-viewport';
      track.parentNode.insertBefore(viewport, track);
      viewport.appendChild(track);

      const nav = document.createElement('div');
      nav.className = 'nx54-nav';
      const dots = document.createElement('div');
      dots.className = 'nx54-dots';
      const progress = document.createElement('span');
      progress.className = 'nx54-progress';
      progress.innerHTML = '<i></i>';
      const dotButtons = originalSlides.map((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'nx54-dot';
        b.setAttribute('aria-label', `Show item ${i + 1}`);
        dots.appendChild(b);
        return b;
      });
      nav.append(dots, progress);
      viewport.after(nav);

      let index = 0;
      let timer = null;
      let dragging = false;
      let moved = false;
      let startX = 0;
      let deltaX = 0;
      let resetTimer = null;

      const clearTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };
      const visibleCount = () => mobileMq.matches ? 1 : (sectionSelector === '#approach' ? 3 : 3);
      const gap = () => parseFloat(getComputedStyle(track).gap || '0') || 0;
      const slideWidth = () => slides[0]?.getBoundingClientRect().width || 0;
      const maxTranslate = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      const targetFor = (i) => {
        const slide = slides[i];
        if (!slide) return 0;
        if (mobileMq.matches) {
          const centered = slide.offsetLeft - ((viewport.clientWidth - slide.clientWidth) / 2);
          return Math.max(0, Math.min(centered, maxTranslate()));
        }
        return Math.max(0, Math.min(slide.offsetLeft, maxTranslate()));
      };
      const realIndex = () => index % originalSlides.length;

      const resetProgress = () => {
        const bar = progress.querySelector('i');
        if (!bar) return;
        bar.style.animation = 'none';
        void bar.offsetWidth;
        bar.style.animation = '';
      };

      const updateStates = () => {
        const r = realIndex();
        originalSlides.forEach((slide, i) => {
          slide.classList.toggle('is-active', i === r);
          slide.classList.toggle('is-next', i === ((r + 1) % originalSlides.length));
          slide.setAttribute('aria-hidden', i === r ? 'false' : 'true');
        });
        firstClone.classList.toggle('is-active', index === originalSlides.length);
        dotButtons.forEach((b, i) => b.classList.toggle('is-active', i === r));
        section.style.setProperty('--nx54-active', r);
      };

      const schedule = () => {
        clearTimer();
        if (reduce || document.hidden) return;
        nav.classList.remove('is-paused');
        nav.classList.add('is-running');
        resetProgress();
        timer = setTimeout(() => go(index + 1, false), HOLD);
      };
      const stop = () => {
        clearTimer();
        nav.classList.remove('is-running');
        nav.classList.add('is-paused');
      };

      const render = (animate = true) => {
        if (!mobileMq.matches && window.innerWidth < 821) return;
        track.style.transition = animate ? `transform ${SHIFT}ms cubic-bezier(.2,.78,.22,1)` : 'none';
        track.style.transform = `translate3d(${-targetFor(index)}px,0,0)`;
        updateStates();
        if (!animate) {
          void track.offsetWidth;
          track.style.transition = '';
        }
        schedule();
      };

      const go = (next, user) => {
        index = next;
        if (index > originalSlides.length) index = 0;
        if (index === originalSlides.length) {
          render(true);
          clearTimeout(resetTimer);
          resetTimer = setTimeout(() => {
            index = 0;
            track.style.transition = 'none';
            track.style.transform = 'translate3d(0,0,0)';
            updateStates();
            void track.offsetWidth;
            track.style.transition = '';
            schedule();
          }, SHIFT + 20);
        } else {
          render(true);
        }
        if (user) viewport.classList.add('nx54-user-touched');
      };

      dotButtons.forEach((b, i) => b.addEventListener('click', () => {
        stop();
        index = i;
        render(true);
      }));

      viewport.addEventListener('pointerdown', e => {
        dragging = true;
        moved = false;
        startX = e.clientX;
        deltaX = 0;
        stop();
        viewport.setPointerCapture?.(e.pointerId);
        track.style.transition = 'none';
      });
      viewport.addEventListener('pointermove', e => {
        if (!dragging) return;
        deltaX = e.clientX - startX;
        if (Math.abs(deltaX) > 10) moved = true;
        const translate = -targetFor(index) + deltaX;
        const clamp = Math.max(-maxTranslate() - 28, Math.min(28, translate));
        track.style.transform = `translate3d(${clamp}px,0,0)`;
      });
      const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        if (Math.abs(deltaX) > 44) go(index + (deltaX < 0 ? 1 : -1), true);
        else render(true);
        deltaX = 0;
      };
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
      slides.forEach(slide => slide.addEventListener('click', e => { if (moved) e.preventDefault(); }));

      document.addEventListener('visibilitychange', () => document.hidden ? stop() : schedule());
      window.addEventListener('resize', () => render(false), { passive: true });
      mobileMq.addEventListener?.('change', () => render(false));

      // Always start from item 01 when the section initializes.
      index = 0;
      render(false);
    };

    sections.forEach(([s, t]) => makeCarousel(s, t));

    // Replace the old vertical Mission/Vision bridge with a full-section diagonal shooting star.
    const mission = document.querySelector('#mission');
    const mv = mission?.querySelector('.nx47-mv');
    if (mission && mv) {
      mission.querySelectorAll('.nx52-star-lane').forEach(el => el.remove());
      if (!mv.querySelector('.nx54-shooting-star')) {
        const meteor = document.createElement('span');
        meteor.className = 'nx54-shooting-star';
        meteor.setAttribute('aria-hidden', 'true');
        meteor.innerHTML = '<i></i><b></b>';
        mv.appendChild(meteor);
      }
    }

    // Keep actual emoji content large enough to read inside its containers.
    const iconSets = {
      '#capabilities .nx50-card-icon':['🎓','💻','⚙️','🧠'],
      '#principles .nx50-card-icon':['🎯','💡','✨','🔄'],
      '#audience .nx50-card-icon':['🎓','💼','🚀','🏢']
    };
    Object.entries(iconSets).forEach(([selector, icons]) => {
      document.querySelectorAll(selector).forEach((el, i) => {
        el.textContent = icons[i] || '✨';
        el.classList.add('nx54-emoji');
      });
    });
    document.querySelectorAll('#approach .nx52-step-emoji').forEach((el, i) => {
      el.textContent = ['🔎','🧭','🛠️','📈'][i] || '✨';
      el.classList.add('nx54-emoji');
    });
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', ready, { once: true })
    : ready();
})();
