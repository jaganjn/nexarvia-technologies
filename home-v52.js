(() => {
  'use strict';

  const ready = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileMq = window.matchMedia('(max-width:820px)');

    // Keep the top-path timing readable and consistent with the homepage story rhythm.
    const heroAuto = document.querySelector('.nx47-auto');
    if (heroAuto) {
      heroAuto.classList.add('nx50-auto-indicator');
      const label = heroAuto.querySelector('span');
      if (label) label.textContent = 'Auto-switching every 2s';
    }

    // Native colour emoji: deliberately large enough to fill their containers.
    const setText = (selector, text) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = text;
    };
    setText('.nx47-path--learning .nx47-icon', '🎓');
    setText('.nx47-path--services .nx47-icon', '💼');

    const heroFeatureMap = {
      '.nx47-path--learning .nx47-feature:nth-child(1) i': '🎯',
      '.nx47-path--learning .nx47-feature:nth-child(2) i': '🧭',
      '.nx47-path--learning .nx47-feature:nth-child(3) i': '🛠️',
      '.nx47-path--learning .nx47-feature:nth-child(4) i': '📈',
      '.nx47-path--learning .nx47-feature:nth-child(5) i': '🏆',
      '.nx47-path--learning .nx47-feature:nth-child(6) i': '🚀',
      '.nx47-path--services .nx47-feature:nth-child(1) i': '💻',
      '.nx47-path--services .nx47-feature:nth-child(2) i': '🗂️',
      '.nx47-path--services .nx47-feature:nth-child(3) i': '⚙️',
      '.nx47-path--services .nx47-feature:nth-child(4) i': '🔄',
      '.nx47-path--services .nx47-feature:nth-child(5) i': '🧠',
      '.nx47-path--services .nx47-feature:nth-child(6) i': '📣'
    };
    Object.entries(heroFeatureMap).forEach(([selector, emoji]) => setText(selector, emoji));

    const iconSets = {
      capabilities: ['🎓', '💻', '⚙️', '🧠'],
      principles: ['🎯', '💡', '✨', '🔄'],
      audience: ['🎓', '💼', '🚀', '🏢']
    };

    const addCardIcons = (selector, icons) => {
      document.querySelectorAll(selector).forEach((card, index) => {
        const old = card.querySelector(':scope > .nx50-card-icon');
        if (old) old.remove();
        const icon = document.createElement('span');
        icon.className = 'nx50-card-icon nx51-emoji';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = icons[index] || '✨';
        card.prepend(icon);
      });
    };

    addCardIcons('#capabilities .nx47-info-card', iconSets.capabilities);
    addCardIcons('#principles .nx47-info-card', iconSets.principles);
    addCardIcons('#audience .nx47-audience article', iconSets.audience);

    // Approach icons remain real emojis and are visually tied to the active step.
    const approach = document.querySelector('#approach .nx47-approach');
    if (approach) {
      const symbols = ['🔎', '🧭', '🛠️', '📈'];
      approach.querySelectorAll('.nx47-step').forEach((step, index) => {
        const old = step.querySelector(':scope > .nx50-step-symbol');
        if (old) old.remove();
        const symbol = document.createElement('span');
        symbol.className = 'nx50-step-symbol nx51-emoji';
        symbol.setAttribute('aria-hidden', 'true');
        symbol.textContent = symbols[index];
        step.appendChild(symbol);
      });
    }

    // Mission / Vision: a real diagonal comet instead of a ball travelling on a static line.
    const mv = document.querySelector('#mission .nx47-mv');
    if (mv) {
      mv.querySelectorAll('.nx52-star-lane').forEach((el) => el.remove());
      const lane = document.createElement('div');
      lane.className = 'nx52-star-lane';
      lane.setAttribute('aria-hidden', 'true');
      lane.innerHTML = '<span class="nx52-shooting-star"><i></i></span>';
      mv.appendChild(lane);
    }

    // Desktop approach also gets a diagonal glowing tail so the process behaves like an active submenu.
    const approachSection = document.querySelector('#approach');
    if (approachSection && !approachSection.querySelector('.nx52-approach-comet')) {
      const comet = document.createElement('span');
      comet.className = 'nx52-approach-comet';
      comet.setAttribute('aria-hidden', 'true');
      comet.innerHTML = '<i></i>';
      approachSection.appendChild(comet);
    }

    function makeCarousel(sectionSelector, trackSelector, opts = {}) {
      const section = document.querySelector(sectionSelector);
      const track = section?.querySelector(trackSelector);
      if (!section || !track || track.dataset.nx52Ready) return null;

      const slides = [...track.children];
      if (slides.length < 2) return null;
      track.dataset.nx52Ready = '1';

      track.classList.add('nx52-track');
      slides.forEach((slide, index) => {
        slide.classList.add('nx52-slide');
        slide.dataset.nx52Index = index;
      });

      // Existing approach rail/connecting lines conflict with the horizontal story deck.
      if (sectionSelector === '#approach') {
        track.querySelectorAll('.nx50-flow-rail').forEach((el) => el.remove());
      }

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

      const dots = slides.map((_, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'nx52-dot';
        button.setAttribute('aria-label', `Show item ${index + 1}`);
        button.addEventListener('click', () => {
          stop();
          go(index, true);
        });
        dotsWrap.appendChild(button);
        return button;
      });
      nav.append(dotsWrap, progress);
      viewport.after(nav);

      let index = 0;
      let holdTimer = null;
      let dragging = false;
      let moved = false;
      let startX = 0;
      let deltaX = 0;
      let sectionVisible = false;

      const HOLD = opts.hold || 2000;
      const SHIFT = opts.shift || 620;

      const clearTimers = () => {
        clearTimeout(holdTimer);
        holdTimer = null;
      };

      const maxTranslate = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

      const targetFor = (itemIndex) => {
        const slide = slides[itemIndex];
        if (!slide) return 0;
        const centred = slide.offsetLeft - ((viewport.clientWidth - slide.clientWidth) / 2);
        return Math.max(0, Math.min(centred, maxTranslate()));
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
          const active = i === index;
          slide.classList.toggle('is-active', active);
          slide.classList.toggle('is-next', i === ((index + 1) % slides.length));
          slide.setAttribute('aria-hidden', active ? 'false' : 'true');
          slide.tabIndex = active ? 0 : -1;
        });
        dots.forEach((dot, i) => {
          dot.classList.toggle('is-active', i === index);
          dot.setAttribute('aria-current', i === index ? 'true' : 'false');
        });
        section.style.setProperty('--nx52-active-index', String(index));
      };

      const schedule = () => {
        clearTimers();
        if (reduce || !sectionVisible || document.hidden) return;
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

      const render = (animate = true) => {
        if (animate) {
          track.style.transition = `transform ${SHIFT}ms var(--nx52-ease)`;
        } else {
          track.style.transition = 'none';
        }
        track.style.transform = `translate3d(${-targetFor(index)}px,0,0)`;
        updateActive();
        if (!animate) {
          void track.offsetWidth;
          track.style.transition = '';
        }
        schedule();
      };

      const go = (target, user = false) => {
        const next = (target + slides.length) % slides.length;
        index = next;
        render(true);
        if (user) viewport.classList.add('nx52-user-touched');
      };

      const resetToFirst = () => {
        clearTimers();
        index = 0;
        nav.classList.remove('is-running');
        nav.classList.add('is-paused');
        render(false);
      };

      viewport.addEventListener('pointerdown', (event) => {
        if (reduce || !sectionVisible) return;
        dragging = true;
        moved = false;
        startX = event.clientX;
        deltaX = 0;
        stop();
        viewport.setPointerCapture?.(event.pointerId);
        track.style.transition = 'none';
      });

      viewport.addEventListener('pointermove', (event) => {
        if (!dragging) return;
        deltaX = event.clientX - startX;
        if (Math.abs(deltaX) > 12) moved = true;
        const translate = -targetFor(index) + deltaX;
        const clamped = Math.max(-maxTranslate() - 30, Math.min(30, translate));
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
      slides.forEach((slide) => slide.addEventListener('click', (event) => {
        if (moved) {
          event.preventDefault();
          moved = false;
        }
      }));

      const visibilityObserver = 'IntersectionObserver' in window
        ? new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            if (entry.isIntersecting) {
              // Every fresh view of a section starts from item 01.
              sectionVisible = true;
              resetToFirst();
            } else {
              sectionVisible = false;
              stop();
              // Do not resume from a middle card after the user scrolls away and back.
              index = 0;
              render(false);
            }
          }, { threshold: 0.22 })
        : null;

      visibilityObserver?.observe(section);

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else if (sectionVisible) schedule();
      });
      window.addEventListener('resize', () => render(false), { passive: true });
      mobileMq.addEventListener?.('change', () => {
        index = 0;
        render(false);
      });

      // Always initialise at item 01 before the section becomes visible.
      updateActive();
      render(false);

      return { resetToFirst, stop, go };
    }

    // Horizontal story decks on both mobile and desktop.
    makeCarousel('#capabilities', '#capabilities .nx47-grid');
    makeCarousel('#principles', '#principles .nx47-grid');
    makeCarousel('#approach', '#approach .nx47-approach');
    makeCarousel('#audience', '#audience .nx47-audience');
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', ready, { once: true })
    : ready();
})();
