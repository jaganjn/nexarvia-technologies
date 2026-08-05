(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Responsive navigation shared by every public page.
  const button = $('[data-nx-menu-button]');
  const drawer = $('[data-nx-drawer]');
  const overlay = $('[data-nx-overlay]');
  const closeButton = $('[data-nx-drawer-close]');
  const setMenu = open => {
    if (!button || !drawer || !overlay) return;
    button.setAttribute('aria-expanded', String(open));
    drawer.classList.toggle('is-open', open);
    overlay.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('nx-menu-open', open);
    if (open) setTimeout(() => drawer.querySelector('a')?.focus(), 60);
    else button.focus({preventScroll:true});
  };
  button?.addEventListener('click', () => setMenu(button.getAttribute('aria-expanded') !== 'true'));
  closeButton?.addEventListener('click', () => setMenu(false));
  overlay?.addEventListener('click', () => setMenu(false));
  drawer?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', event => { if (event.key === 'Escape' && drawer?.classList.contains('is-open')) setMenu(false); });
  addEventListener('resize', () => { if (innerWidth > 1180 && drawer?.classList.contains('is-open')) setMenu(false); }, {passive:true});

  // Safe entrance animation through Web Animations: content remains visible if JS fails.
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.nxAnimated) return;
      entry.target.dataset.nxAnimated = 'true';
      const delay = Number(entry.target.dataset.nxDelay || 0);
      entry.target.animate([
        {opacity:.01, transform:'translateY(24px)'},
        {opacity:1, transform:'translateY(0)'}
      ], {duration:650, delay, easing:'cubic-bezier(.2,.8,.2,1)', fill:'both'});
      observer.unobserve(entry.target);
    }), {threshold:.11, rootMargin:'0px 0px -36px'});
    $$('.nx-reveal').forEach((el, index) => {
      if (!el.dataset.nxDelay) el.dataset.nxDelay = String(Math.min((index % 4) * 55, 165));
      observer.observe(el);
    });
  }

  // Homepage bridge between Learning and Technology Services.
  const bridge = $('[data-nx-bridge]');
  if (bridge) {
    const tabs = $$('.nx-bridge-tab', bridge);
    let state = bridge.dataset.state || 'learning';
    let timer = null;
    const apply = next => {
      state = next;
      bridge.dataset.state = state;
      tabs.forEach(tab => {
        const active = tab.dataset.bridge === state;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
      });
    };
    const cycle = () => { if (!reducedMotion) timer = setInterval(() => apply(state === 'learning' ? 'services' : 'learning'), 5600); };
    const restart = () => { clearInterval(timer); cycle(); };
    tabs.forEach(tab => tab.addEventListener('click', () => { apply(tab.dataset.bridge); restart(); }));
    bridge.addEventListener('pointerenter', () => clearInterval(timer));
    bridge.addEventListener('pointerleave', cycle);
    apply(state); cycle();
  }

  // Back-to-top visibility.
  const backTop = $('.nx-back-top');
  const updateTop = () => backTop?.classList.toggle('is-visible', scrollY > 700);
  addEventListener('scroll', updateTop, {passive:true}); updateTop();

  // Technology Services enquiry form.
  const form = $('#technologyInquiryForm');
  if (form) {
    const submit = $('#technologyInquirySubmit');
    const message = $('#technologyInquiryMessage');
    const success = $('#technologyInquirySuccess');
    const formContent = $('#technologyInquiryContent');
    const referenceOutput = $('#technologyInquiryReference');
    const cooldownKey = 'nexarviaTechnologyInquiryLastSubmitV23';
    const clean = (value, max = 6000) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
    const showMessage = (text, type = 'error') => {
      if (!message) return;
      message.textContent = text;
      message.className = `nx-form-message is-${type}`;
      message.scrollIntoView({behavior: reducedMotion ? 'auto' : 'smooth', block:'center'});
    };
    const makeReference = () => {
      const d = new Date();
      const stamp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`;
      const random = Math.random().toString(36).slice(2,8).toUpperCase();
      return `NXT-${stamp}-${random}`;
    };
    form.addEventListener('submit', async event => {
      event.preventDefault();
      message.className = 'nx-form-message'; message.textContent = '';
      if (!form.reportValidity()) return;
      if (form.elements.website?.value) return; // Honeypot.
      let last = 0;
      try { last = Number(localStorage.getItem(cooldownKey) || 0); } catch { last = 0; }
      if (Date.now() - last < 45000) {
        showMessage('Please wait a moment before sending another enquiry.');
        return;
      }
      if (typeof db === 'undefined' || typeof firebase === 'undefined') {
        showMessage('The enquiry service is temporarily unavailable. Please try again shortly.');
        return;
      }
      const fd = new FormData(form);
      const reference = makeReference();
      const payload = {
        reference,
        fullName: clean(fd.get('fullName'), 100),
        organisation: clean(fd.get('organisation'), 140),
        email: clean(fd.get('email'), 160).toLowerCase(),
        phone: clean(fd.get('phone'), 30),
        location: clean(fd.get('location'), 120),
        service: clean(fd.get('service'), 90),
        projectType: clean(fd.get('projectType'), 100),
        budget: clean(fd.get('budget'), 80),
        timeline: clean(fd.get('timeline'), 80),
        requirements: String(fd.get('requirements') || '').trim().slice(0, 6000),
        preferredContact: clean(fd.get('preferredContact'), 40),
        consent: fd.get('consent') === 'on',
        status: 'new',
        source: 'technology-services-page',
        pageUrl: location.href.slice(0, 500),
        referrer: document.referrer.slice(0, 500),
        submittedAt: firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      };
      if (!payload.consent) { showMessage('Please confirm the privacy and contact consent before submitting.'); return; }
      submit.disabled = true; submit.textContent = 'Sending enquiry…';
      try {
        await db.ref(`technologyServiceInquiries/${reference}`).set(payload);
        try { localStorage.setItem(cooldownKey, String(Date.now())); } catch { /* Storage may be unavailable in restricted browsers. */ }
        form.reset();
        if (referenceOutput) referenceOutput.textContent = reference;
        formContent?.setAttribute('hidden','');
        success?.classList.add('is-visible');
        success?.scrollIntoView({behavior: reducedMotion ? 'auto' : 'smooth', block:'center'});
      } catch (error) {
        console.error('Technology enquiry submission failed:', error);
        const blocked = /permission|denied/i.test(String(error?.message || error?.code || ''));
        showMessage(blocked ? 'Firebase rules blocked the enquiry. Publish the V23 Realtime Database rules and try again.' : 'We could not send your enquiry. Please check your connection and try again.');
      } finally {
        submit.disabled = false; submit.textContent = 'Submit Business Enquiry →';
      }
    });
    $('#newTechnologyInquiry')?.addEventListener('click', () => {
      success?.classList.remove('is-visible'); formContent?.removeAttribute('hidden');
      form.scrollIntoView({behavior: reducedMotion ? 'auto' : 'smooth', block:'start'});
    });
  }
})();
