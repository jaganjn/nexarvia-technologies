(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const header = document.querySelector('.site-header');
  const heroArt = document.querySelector('.hero-art');
  const cursorLight = document.getElementById('cursorLight');

  document.documentElement.classList.add('premium-motion-enabled');

  const updateHeader = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 28);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const revealTargets = [
    ...document.querySelectorAll('.section-heading, .services-heading, .application-intro, .application-card, .portal-copy, .portal-preview, .company-principle, .services-layout, .services-transparency-note, .final-cta'),
    ...document.querySelectorAll('.trust-strip article, .company-pillar, .pathway-grid article, .receive-grid article, .technology-service-grid article, .project-grid article, .fit-grid article, .domain-detail, .how-grid article, .proof-grid article, .faq-list details')
  ];

  revealTargets.forEach((element, index) => {
    element.classList.add('motion-reveal');
    if (element.matches('.application-intro, .portal-copy')) element.classList.add('from-left');
    if (element.matches('.application-card, .portal-preview')) element.classList.add('from-right');
    element.style.setProperty('--reveal-delay', `${Math.min((index % 8) * 55, 330)}ms`);
  });

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealTargets.forEach(element => observer.observe(element));
  } else {
    revealTargets.forEach(element => element.classList.add('is-visible'));
  }

  const spotlightCards = document.querySelectorAll('.premium-spotlight, .receive-grid article, .project-grid article, .how-grid article, .proof-grid article, .technology-service-grid article');
  spotlightCards.forEach(card => {
    if (!card.classList.contains('premium-spotlight')) card.classList.add('premium-spotlight');
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
    }, { passive: true });
  });

  if (finePointer && !reducedMotion) {
    document.body.classList.add('pointer-active');
    window.addEventListener('pointermove', event => {
      if (!cursorLight) return;
      cursorLight.style.left = `${event.clientX}px`;
      cursorLight.style.top = `${event.clientY}px`;
    }, { passive: true });

    if (heroArt) {
      heroArt.addEventListener('pointermove', event => {
        const rect = heroArt.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        heroArt.style.transform = `perspective(1100px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-3px)`;
      });
      heroArt.addEventListener('pointerleave', () => {
        heroArt.style.transform = '';
      });
    }
  }

  if (!reducedMotion) {
    let ticking = false;
    const auroraOne = document.querySelector('.aurora-one');
    const auroraTwo = document.querySelector('.aurora-two');
    const parallax = () => {
      const y = window.scrollY;
      if (auroraOne) auroraOne.style.marginTop = `${y * .018}px`;
      if (auroraTwo) auroraTwo.style.marginTop = `${-y * .014}px`;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(parallax);
        ticking = true;
      }
    }, { passive: true });
  }

  document.querySelectorAll('.mobile-menu-nav a, .mobile-menu-actions a').forEach(link => {
    link.addEventListener('click', () => {
      const menu = link.closest('details');
      if (menu) menu.open = false;
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const selector = link.getAttribute('href');
      if (!selector || selector === '#') return;
      const target = document.querySelector(selector);
      if (!target) return;
      event.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight || 72) - 18;
      window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', selector);
    });
  });
})();
