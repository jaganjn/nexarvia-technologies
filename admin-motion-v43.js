(() => {
  "use strict";

  if (!document.body.classList.contains("admin-page")) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const animated = new WeakSet();

  function entrance(element, index = 0, compact = false) {
    if (!element || animated.has(element) || reduced) return;
    animated.add(element);
    element.animate([
      { opacity: .35, transform: `translateY(${compact ? 8 : 16}px) scale(.992)`, filter: "saturate(.86)" },
      { opacity: 1, transform: "translateY(0) scale(1)", filter: "saturate(1)" }
    ], {
      duration: compact ? 420 : 620,
      delay: Math.min(index * 58, 420),
      easing: "cubic-bezier(.2,.75,.2,1)",
      fill: "none"
    });
  }

  function animateInitialShell() {
    entrance($(".topbar"), 0, true);
    entrance($(".hero"), 1);
    $$(".metric").forEach((element, index) => entrance(element, index + 2, true));
  }

  function setupSectionObserver() {
    if (reduced || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entrance(entry.target, 0, entry.target.matches(".panel,.referral-metrics article"));
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: "0px 0px -5% 0px" });

    $$(".panel,.section-head,.referral-metrics article").forEach(element => observer.observe(element));
  }

  function pulseMetrics() {
    $$(".metric h3,.referral-metrics strong").forEach(counter => {
      const observer = new MutationObserver(() => {
        counter.classList.remove("admin-count-pulse");
        void counter.offsetWidth;
        counter.classList.add("admin-count-pulse");
      });
      observer.observe(counter, { childList: true, characterData: true, subtree: true });
    });
  }

  function animateNewData(root = document) {
    $$(".visitor-card,.application-item,.rank-item,.rank-row,.realtime-bar,.service-breakdown article,.announcement-item,.admin-alert-item,tr", root)
      .slice(-18)
      .forEach((element, index) => {
        element.classList.remove("admin-data-arrival");
        element.style.animationDelay = `${Math.min(index * 35, 260)}ms`;
        void element.offsetWidth;
        element.classList.add("admin-data-arrival");
      });

    $$(".chart-bar,.realtime-bar i,.service-breakdown i", root).forEach((bar, index) => {
      bar.classList.remove("admin-bar-grow");
      bar.style.animationDelay = `${Math.min(index * 45, 300)}ms`;
      void bar.offsetWidth;
      bar.classList.add("admin-bar-grow");
    });
  }

  function observeDataRegions() {
    const selectors = [
      "#visitorList", "#recentApplications", "#applicationsChart", "#topColleges", "#topDomains",
      "#referralLeaderboardBody", "#referralFriendsBody", "#technologyInquiryBody",
      "#technologyInquiryRealtimeChart", "#technologyServiceBreakdown", "#announcementList", "#adminNotificationList"
    ];

    selectors.forEach(selector => {
      const region = $(selector);
      if (!region) return;
      const observer = new MutationObserver(() => animateNewData(region));
      observer.observe(region, { childList: true, subtree: true });
    });
  }

  function animateScreenChange() {
    document.addEventListener("nexarvia:admin-screen-change", event => {
      if (reduced) return;
      const visible = event.detail?.visible || [];
      visible.forEach((section, index) => {
        section.animate([
          { opacity: .45, transform: "translateX(10px)" },
          { opacity: 1, transform: "translateX(0)" }
        ], {
          duration: 430,
          delay: index * 55,
          easing: "cubic-bezier(.2,.75,.2,1)",
          fill: "none"
        });
      });
    });
  }

  function init() {
    animateInitialShell();
    setupSectionObserver();
    pulseMetrics();
    observeDataRegions();
    animateScreenChange();
    animateNewData();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
