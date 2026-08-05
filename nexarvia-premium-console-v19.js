(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;
  const items = document.querySelectorAll('.crm-login-card, .crm-login-copy, .metric, .panel, .referral-metrics article, .settings, .admin-footer');
  items.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(22px)';
    item.style.transition = `opacity .65s ease ${Math.min(index * 45, 300)}ms, transform .65s cubic-bezier(.22,.72,.18,1) ${Math.min(index * 45, 300)}ms`;
  });
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.style.opacity = '1';
    entry.target.style.transform = 'translateY(0)';
    observer.unobserve(entry.target);
  }), { threshold: .08 });
  items.forEach(item => observer.observe(item));
})();
