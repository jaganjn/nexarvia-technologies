/*
  Nexarvia Technologies public contact and social configuration.
  Paste only verified official URLs. Empty values remain safely disabled.
*/
window.NEXARVIA_SITE_CONFIG = {
  supportEmail: "",
  social: {
    linkedin: "",
    instagram: "",
    youtube: "",
    facebook: "",
    whatsapp: ""
  }
};

(function applyNexarviaSiteConfig() {
  const getValue = (path) => path.split(".").reduce((value, key) => value && value[key], window.NEXARVIA_SITE_CONFIG);

  document.querySelectorAll("[data-config-link]").forEach((link) => {
    const value = String(getValue(link.dataset.configLink) || "").trim();
    if (value) {
      link.href = value;
      link.removeAttribute("aria-disabled");
      link.removeAttribute("tabindex");
      link.title = link.dataset.readyTitle || link.title || "Open official Nexarvia Technologies channel";
      if (/^https?:/i.test(value)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    } else {
      link.href = "#";
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");
      link.title = "Official link not configured — update site-config.js";
      link.addEventListener("click", (event) => event.preventDefault());
    }
  });

  const mobileMenu = document.querySelector(".mobile-menu");
  mobileMenu?.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", () => mobileMenu.removeAttribute("open"));
  });

  document.addEventListener("click", (event) => {
    if (mobileMenu?.open && !mobileMenu.contains(event.target)) mobileMenu.removeAttribute("open");
  });
})();
