(() => {
  'use strict';

  const form = document.getElementById('technologyInquiryForm');
  if (!form) return;

  const submitButton = document.getElementById('technologyInquirySubmit');
  const message = document.getElementById('technologyInquiryMessage');
  const success = document.getElementById('technologyInquirySuccess');
  const content = document.getElementById('technologyInquiryContent');
  const referenceNode = document.getElementById('technologyInquiryReference');
  const sheetStatus = document.getElementById('technologyInquirySheetStatus');
  const newButton = document.getElementById('newTechnologyInquiry');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cooldownKey = 'nexarviaTechnologyInquiryLastSubmitV36';
  let submitting = false;

  const showMessage = (text, type = 'error') => {
    if (!message) return;
    message.textContent = text;
    message.className = `nx-form-message is-${type}`;
    message.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  };

  const clean = (value, max = 6000) => String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, max);

  const makeReference = () => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `NXT-${yearMonth}-${random}`;
  };

  const setSubmitting = (active) => {
    submitting = active;
    if (!submitButton) return;
    submitButton.disabled = active;
    submitButton.setAttribute('aria-busy', String(active));
    submitButton.textContent = active ? 'Sending enquiry…' : 'Submit Business Enquiry →';
  };

  const mirrorToGoogleSheets = async (payload) => {
    const endpoint = String(window.NEXARVIA_SITE_CONFIG?.technologyInquirySheetEndpoint || '').trim();
    if (!endpoint) return { configured: false, sent: false };

    // Apps Script web apps do not return readable CORS responses in this setup.
    // no-cors prevents the browser from blocking the request itself.
    await fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      keepalive: true
    });
    return { configured: true, sent: true };
  };

  form.addEventListener('submit', async (event) => {
    // Always stop the browser's native form navigation/reload.
    event.preventDefault();
    event.stopPropagation();

    if (submitting) return;
    if (message) {
      message.textContent = '';
      message.className = 'nx-form-message';
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      showMessage('Please complete all required fields correctly.');
      return;
    }

    if (form.elements.website?.value) return; // Honeypot.

    const requirements = String(form.elements.requirements?.value || '').trim();
    if (requirements.length < 20) {
      showMessage('Please describe your requirement using at least 20 characters.');
      form.elements.requirements?.focus();
      return;
    }

    let lastSubmit = 0;
    try { lastSubmit = Number(localStorage.getItem(cooldownKey) || 0); } catch (_) {}
    if (Date.now() - lastSubmit < 45000) {
      showMessage('Please wait a moment before sending another enquiry.');
      return;
    }

    if (!window.firebase || !window.db) {
      showMessage('The enquiry service did not load. Refresh once and check your internet connection.');
      return;
    }

    const data = new FormData(form);
    const reference = makeReference();
    const serverTimestamp = firebase.database.ServerValue.TIMESTAMP;
    const payload = {
      reference,
      fullName: clean(data.get('fullName'), 100),
      organisation: clean(data.get('organisation'), 140),
      email: clean(data.get('email'), 160).toLowerCase(),
      phone: clean(data.get('phone'), 30),
      location: clean(data.get('location'), 120),
      service: clean(data.get('service'), 90),
      projectType: clean(data.get('projectType'), 100),
      budget: clean(data.get('budget'), 80),
      timeline: clean(data.get('timeline'), 80),
      preferredContact: clean(data.get('preferredContact'), 40),
      requirements: requirements.slice(0, 6000),
      consent: data.get('consent') === 'on',
      status: 'new',
      source: 'technology-services-page',
      pageUrl: location.href.slice(0, 500),
      referrer: document.referrer.slice(0, 500),
      submittedAt: serverTimestamp,
      updatedAt: serverTimestamp
    };

    if (!payload.consent) {
      showMessage('Please confirm the privacy and contact consent checkbox.');
      return;
    }

    setSubmitting(true);
    showMessage('Securely sending your enquiry…', 'info');

    try {
      await db.ref(`technologyServiceInquiries/${reference}`).set(payload);

      let sheetMessage = 'Your enquiry has been recorded for review.';
      try {
        const sheetPayload = { ...payload, submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        const result = await mirrorToGoogleSheets(sheetPayload);
        if (result.configured) sheetMessage = 'Your enquiry was recorded and forwarded to our follow-up register.';
      } catch (sheetError) {
        console.warn('Google Sheets mirror failed:', sheetError);
        sheetMessage = 'Your enquiry was recorded successfully. The internal follow-up copy will be retried separately.';
      }

      try { localStorage.setItem(cooldownKey, String(Date.now())); } catch (_) {}
      form.reset();
      if (referenceNode) referenceNode.textContent = reference;
      if (sheetStatus) sheetStatus.textContent = sheetMessage;
      content?.setAttribute('hidden', '');
      success?.classList.add('is-visible');
      success?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    } catch (error) {
      console.error('Technology enquiry failed:', error);
      const detail = String(error?.code || error?.message || error);
      if (/permission|denied/i.test(detail)) {
        showMessage('Firebase blocked the enquiry. Publish the included Realtime Database rules and try again.');
      } else if (/network|offline|failed/i.test(detail)) {
        showMessage('The network connection was interrupted. Check your internet and try again.');
      } else {
        showMessage('The enquiry could not be sent. Open the browser console for the exact error, then try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, { capture: true });

  newButton?.addEventListener('click', () => {
    success?.classList.remove('is-visible');
    content?.removeAttribute('hidden');
    form.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
})();
