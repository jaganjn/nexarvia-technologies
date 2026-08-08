(() => {
  "use strict";
  const body = document.body;
  const isLearning = body.classList.contains("nx24-learning-page");
  const isServices = body.classList.contains("nx24-services-page");
  if (!isLearning && !isServices) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = document.querySelector(isLearning ? ".nx24-division-hero" : ".nx32-services-hero");
  if (hero && !hero.querySelector(".nx-division-graphic-layer")) {
    const layer = document.createElement("div");
    layer.className = "nx-division-graphic-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.innerHTML = '<span class="orb-a"></span><span class="orb-b"></span><span class="route"></span>';
    hero.prepend(layer);
  }
  const revealSelectors = [
    "main > section", ".nx24-section-head", ".nx27-project-shell", ".nx25-learning-hero-grid",
    ".nx32-services-grid", ".nx33-services-head", ".nx33-services-cta", ".nx34-trust-grid", ".nx-inquiry-shell"
  ];
  const reveals = [...new Set(revealSelectors.flatMap(s => [...document.querySelectorAll(s)]))];
  reveals.forEach((el, i) => {
    el.classList.add("nx-div-reveal");
    el.style.setProperty("--nx-div-delay", `${Math.min((i % 4) * 70, 210)}ms`);
  });
  const cards = document.querySelectorAll(".nx25-programme-card,.nx27-project-step,.nx25-journey-stop,.nx25-lifecycle-card,.nx33-service-card,.nx34-trust-card,.nx32-proof-grid article");
  cards.forEach(c => c.classList.add("nx-div-card"));
  if (reduced || !("IntersectionObserver" in window)) reveals.forEach(x => x.classList.add("is-visible"));
  else {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-visible");
      io.unobserve(e.target);
    }), { threshold: .08, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(x => io.observe(x));
  }
  const stages = [...document.querySelectorAll(isLearning ? ".nx26-map-route article" : ".nx32-journey-step")];
  if (!reduced && stages.length) {
    let index = 0;
    const activate = () => {
      stages.forEach((x, i) => x.classList.toggle("is-spotlit", i === index));
      index = (index + 1) % stages.length;
    };
    activate();
    const timer = setInterval(activate, isLearning ? 2400 : 2100);
    document.addEventListener("visibilitychange", () => { if (document.hidden) stages.forEach(x => x.classList.remove("is-spotlit")); else activate(); });
    window.addEventListener("beforeunload", () => clearInterval(timer), { once: true });
  }
})();
