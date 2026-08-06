(() => {
  "use strict";
  const refresh = () => {
    if (typeof window.__nxApplyDesktopMirror === "function") {
      window.__nxApplyDesktopMirror();
    }
    document.documentElement.dataset.desktopMirror =
      document.documentElement.classList.contains("nx-desktop-mirror-mode") ? "ready" : "desktop";
    document.documentElement.dataset.desktopLayoutWidth = String(Math.round(window.innerWidth));
  };
  refresh();
  window.addEventListener("orientationchange", () => setTimeout(refresh, 80), { passive: true });
  window.addEventListener("resize", refresh, { passive: true });
  window.visualViewport?.addEventListener("resize", refresh, { passive: true });
})();
