(() => {
  "use strict";

  const DESKTOP_WIDTH = 1440;
  const ROOT_CLASS = "desktop-mirror-mode";
  const BODY_CLASS = "desktop-mirror-enabled";

  document.documentElement.classList.add(ROOT_CLASS);

  const shell = document.getElementById("desktop-fit-shell");
  const canvas = document.getElementById("desktop-canvas");

  if (!shell || !canvas) {
    console.error(
      "Desktop mirror could not initialise because #desktop-fit-shell or #desktop-canvas is missing."
    );
    return;
  }

  document.body.classList.add(BODY_CLASS);

  let frame = 0;
  let lastScale = -1;
  let lastHeight = -1;

  function isCoarsePointerDevice() {
    return (
      window.matchMedia?.("(pointer: coarse)").matches ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    );
  }

  function getPhysicalCssWidth() {
    if (!isCoarsePointerDevice()) {
      return Math.max(1, window.innerWidth || document.documentElement.clientWidth || DESKTOP_WIDTH);
    }

    const screenWidth = Number(window.screen?.width) || 0;
    const screenHeight = Number(window.screen?.height) || 0;
    const orientation = window.screen?.orientation?.type || "";
    const landscape = orientation.startsWith("landscape");

    if (screenWidth && screenHeight) {
      return landscape
        ? Math.max(screenWidth, screenHeight)
        : Math.min(screenWidth, screenHeight);
    }

    const visualWidth = Number(window.visualViewport?.width) || 0;
    if (visualWidth && visualWidth < DESKTOP_WIDTH) {
      return visualWidth;
    }

    return Math.max(1, document.documentElement.clientWidth || DESKTOP_WIDTH);
  }

  function updateMirror() {
    const availableWidth = Math.min(DESKTOP_WIDTH, getPhysicalCssWidth());
    const scale = Math.min(1, Math.max(0.1, availableWidth / DESKTOP_WIDTH));
    const naturalHeight = Math.max(
      canvas.scrollHeight,
      canvas.offsetHeight,
      canvas.getBoundingClientRect().height / Math.max(scale, 0.1)
    );
    const scaledWidth = Math.ceil(DESKTOP_WIDTH * scale);
    const scaledHeight = Math.ceil(naturalHeight * scale);

    if (Math.abs(scale - lastScale) > 0.0001) {
      document.documentElement.style.setProperty(
        "--desktop-page-scale",
        String(scale)
      );
      lastScale = scale;
    }

    shell.style.width = `${scaledWidth}px`;
    shell.style.maxWidth = `${scaledWidth}px`;

    if (scaledHeight !== lastHeight) {
      shell.style.height = `${scaledHeight}px`;
      document.body.style.minHeight = `${scaledHeight}px`;
      lastHeight = scaledHeight;
    }

    shell.dataset.desktopWidth = String(DESKTOP_WIDTH);
    shell.dataset.desktopScale = scale.toFixed(5);
  }

  function scheduleUpdate() {
    if (frame) {
      cancelAnimationFrame(frame);
    }

    frame = requestAnimationFrame(() => {
      frame = 0;
      updateMirror();
    });
  }

  scheduleUpdate();
  window.addEventListener("load", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  window.addEventListener("orientationchange", scheduleUpdate, { passive: true });
  window.visualViewport?.addEventListener("resize", scheduleUpdate, {
    passive: true
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleUpdate).catch(() => {});
  }

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(canvas);
  }

  if ("MutationObserver" in window) {
    const mutationObserver = new MutationObserver(scheduleUpdate);
    mutationObserver.observe(canvas, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "open"]
    });
  }

  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest?.('a[href^="#"]');
      if (!link || link.getAttribute("href") === "#") {
        return;
      }

      const target = document.querySelector(link.getAttribute("href"));
      if (!target) {
        return;
      }

      event.preventDefault();
      const rect = target.getBoundingClientRect();
      const header = canvas.querySelector(".nx-site-header, .site-header, header");
      const headerOffset = header
        ? Math.max(0, header.getBoundingClientRect().height + 10)
        : 0;

      window.scrollTo({
        top: Math.max(0, window.scrollY + rect.top - headerOffset),
        behavior: "smooth"
      });

      try {
        history.replaceState(null, "", link.getAttribute("href"));
      } catch (_) {}
    },
    true
  );
})();
