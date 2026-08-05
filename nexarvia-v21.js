document.documentElement.classList.add('js-ready');
(() => {
  const progress = document.getElementById('v21Progress');
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener('scroll', updateProgress, {passive:true}); updateProgress();
  const reveal = [...document.querySelectorAll('.v21-reveal')];
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), {threshold:.12, rootMargin:'0px 0px -40px'});
    reveal.forEach(el => observer.observe(el));
  } else reveal.forEach(el => el.classList.add('is-visible'));
  const menu = document.querySelector('.v21-mobile-menu');
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => menu.removeAttribute('open')));
  document.addEventListener('click', e => { if (menu?.open && !menu.contains(e.target)) menu.removeAttribute('open'); });
})();