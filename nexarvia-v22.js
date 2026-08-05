
(() => {
  // Stagger reveal timing without ever hiding content permanently.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.v21-card-grid, .v21-principle-grid, .v21-division-grid, .v21-project-process, .v21-service-process').forEach(group => {
    [...group.children].forEach((item, index) => {
      if (!reduced) item.style.transitionDelay = `${Math.min(index * 55, 330)}ms`;
    });
  });

  // Subtle pointer parallax is limited to large screens and decorative visuals only.
  if (!reduced && matchMedia('(min-width: 1000px)').matches) {
    document.querySelectorAll('.v21-ecosystem-visual, .v21-service-visual').forEach(visual => {
      visual.addEventListener('pointermove', event => {
        const rect = visual.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        visual.style.setProperty('--v22-x', `${x * 8}px`);
        visual.style.setProperty('--v22-y', `${y * 8}px`);
        visual.querySelectorAll('.v21-visual-card, .v21-service-screen').forEach(el => {
          el.style.translate = `${x * 7}px ${y * 7}px`;
        });
      });
      visual.addEventListener('pointerleave', () => {
        visual.querySelectorAll('.v21-visual-card, .v21-service-screen').forEach(el => { el.style.translate = ''; });
      });
    });
  }
})();
