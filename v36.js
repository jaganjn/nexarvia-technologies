(() => {
  const root = document.querySelector('.nx26-learning-map');
  if (!root) return;

  const track = root.querySelector('[data-learning-journey-track]');
  if (!track) return;

  const cards = [...track.querySelectorAll('[data-journey-step]')];
  const status = root.querySelector('[data-learning-journey-status]');
  const progress = root.querySelector('[data-learning-journey-progress]');
  const knob = root.querySelector('[data-learning-journey-knob]');
  const nextButton = root.querySelector('[data-learning-journey-next]');
  const dots = [...root.querySelectorAll('[data-learning-journey-dot]')];
  const live = root.querySelector('[data-learning-journey-live]');
  const mobile = window.matchMedia('(max-width: 720px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const descriptions = [
    'Choose a career-focused programme.',
    'Complete clear modules and lessons.',
    'Practise through assignments.',
    'Develop a guided project.',
    'Review milestones and completion.'
  ];

  let current = 0;
  let timer = null;
  let resumeTimer = null;
  let scrollTimer = null;
  let isVisible = false;

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
    if (resumeTimer) window.clearTimeout(resumeTimer);
    resumeTimer = null;
  };

  // Desktop must remain exactly as the original five-column journey.
  // No active card, scrolling, ARIA hiding, progress animation, or autoplay is applied.
  const restoreDesktop = () => {
    stop();
    current = 0;
    cards.forEach(card => {
      card.classList.remove('is-active');
      card.removeAttribute('aria-hidden');
    });
    dots.forEach(dot => {
      dot.classList.remove('is-active');
      dot.removeAttribute('aria-current');
    });
    if (status) status.textContent = 'STEP 1 OF 5 · 20% COMPLETE';
    if (progress) progress.style.removeProperty('width');
    if (knob) knob.style.removeProperty('left');
    track.scrollLeft = 0;
  };

  const centreCard = (index, smooth = true) => {
    if (!mobile.matches) return;
    const card = cards[index];
    if (!card) return;
    const left = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    const behavior = smooth && !reducedMotion.matches ? 'smooth' : 'auto';
    if (typeof track.scrollTo === 'function') track.scrollTo({ left, behavior });
    else track.scrollLeft = left;
  };

  const renderMobile = (index, { smooth = true, announce = true } = {}) => {
    if (!mobile.matches) {
      restoreDesktop();
      return;
    }

    current = (index + cards.length) % cards.length;
    cards.forEach((card, cardIndex) => {
      const active = cardIndex === current;
      card.classList.toggle('is-active', active);
      card.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === current;
      dot.classList.toggle('is-active', active);
      if (active) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });

    const percent = ((current + 1) / cards.length) * 100;
    if (status) status.textContent = `STEP ${current + 1} OF ${cards.length} · ${Math.round(percent)}% COMPLETE`;
    if (progress) progress.style.width = `${percent}%`;
    if (knob) knob.style.left = `${percent}%`;
    if (announce && live) live.textContent = `Step ${current + 1}: ${descriptions[current]}`;
    centreCard(current, smooth);
  };

  const start = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
    if (!mobile.matches || reducedMotion.matches || !isVisible || document.hidden) return;
    timer = window.setInterval(() => renderMobile(current + 1), 3400);
  };

  const pauseThenResume = () => {
    if (!mobile.matches) return;
    if (timer) window.clearInterval(timer);
    timer = null;
    if (resumeTimer) window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(start, 6500);
  };

  nextButton?.addEventListener('click', () => {
    if (!mobile.matches) return;
    renderMobile(current + 1);
    pauseThenResume();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      if (!mobile.matches) return;
      renderMobile(index);
      pauseThenResume();
    });
  });

  track.addEventListener('pointerdown', pauseThenResume, { passive: true });
  track.addEventListener('touchstart', pauseThenResume, { passive: true });
  track.addEventListener('scroll', () => {
    if (!mobile.matches) return;
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      const centre = track.scrollLeft + track.clientWidth / 2;
      let nearest = 0;
      let distance = Infinity;
      cards.forEach((card, index) => {
        const cardCentre = card.offsetLeft + card.offsetWidth / 2;
        const nextDistance = Math.abs(cardCentre - centre);
        if (nextDistance < distance) {
          distance = nextDistance;
          nearest = index;
        }
      });
      if (nearest !== current) renderMobile(nearest, { smooth: false, announce: true });
    }, 110);
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      isVisible = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.35);
      if (!mobile.matches) return;
      if (isVisible) {
        renderMobile(current, { smooth: false, announce: false });
        start();
      } else if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }, { threshold: [0, .35, .7] });
    observer.observe(root);
  } else {
    isVisible = true;
  }

  const onMediaChange = () => {
    if (mobile.matches) {
      current = 0;
      renderMobile(0, { smooth: false, announce: false });
      start();
    } else {
      restoreDesktop();
    }
  };

  const bindMediaChange = (query, handler) => {
    if (typeof query.addEventListener === 'function') query.addEventListener('change', handler);
    else if (typeof query.addListener === 'function') query.addListener(handler);
  };

  bindMediaChange(mobile, onMediaChange);
  bindMediaChange(reducedMotion, start);
  document.addEventListener('visibilitychange', start);
  window.addEventListener('resize', () => {
    if (mobile.matches) centreCard(current, false);
  }, { passive: true });

  if (mobile.matches) renderMobile(0, { smooth: false, announce: false });
  else restoreDesktop();
})();
