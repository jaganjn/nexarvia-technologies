(() => {
  "use strict";

  const mobileQuery = window.matchMedia("(max-width: 767px)");
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const icons = {
    dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    applications: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v4H7z"/><rect x="5" y="5" width="14" height="16" rx="2"/><path d="M8 11h8M8 15h8"/></svg>',
    enquiries: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5Z"/><path d="M8 9h8M8 13h5"/></svg>',
    referrals: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="7" r="2"/><path d="M3 20c0-4 2-6 5-6s5 2 5 6M14 14c3 0 5 2 5 5"/></svg>',
    more: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };

  let mobileInitialised = false;
  let tableObserver = null;

  function labelTables(root = document) {
    $$(".table-wrap table", root).forEach(table => {
      const headings = $$("thead th", table).map(cell => cell.textContent.trim());
      $$("tbody tr", table).forEach(row => {
        [...row.children].forEach((cell, index) => {
          if (!cell.hasAttribute("colspan")) {
            cell.dataset.label = headings[index] || "Detail";
          }
        });
      });
    });
  }

  function replaceBottomNav() {
    const nav = $(".bottom-nav");
    if (!nav) return null;

    nav.className = "bottom-nav admin-mobile-nav-v41";
    nav.setAttribute("aria-label", "Mobile admin navigation");
    nav.innerHTML = [
      ["dashboard", "Dashboard"],
      ["applications", "Applications"],
      ["enquiries", "Enquiries"],
      ["referrals", "Referrals"],
      ["more", "More"]
    ].map(([target, label], index) => `
      <button type="button" data-admin-screen="${target}" class="${index === 0 ? "is-active" : ""}" aria-pressed="${index === 0}">
        ${icons[target]}
        <span>${label}</span>
      </button>
    `).join("");

    return nav;
  }

  function mainSections() {
    const main = $(".workspace > main");
    if (!main) return { main: null, sections: [] };
    return {
      main,
      sections: [...main.children].filter(node => node.nodeType === Node.ELEMENT_NODE)
    };
  }

  function rangeBetween(sections, start, stopBefore) {
    const startIndex = sections.indexOf(start);
    const stopIndex = sections.indexOf(stopBefore);
    if (startIndex < 0) return [];
    return sections.slice(startIndex, stopIndex < 0 ? sections.length : stopIndex);
  }

  function showScreen(name, nav, shouldScroll = true) {
    const { main, sections } = mainSections();
    if (!main || sections.length === 0) return;

    const hero = $("#dashboard", main);
    const metrics = $(".metric-grid", main);
    const dashboardGrid = $(".dashboard-grid", main);
    const applications = $("#applications", main);
    const referralStart = $("#referralOverview", main);
    const enquiryStart = $("#technologyInquiries", main);
    const announcements = $("#announcements", main);
    const settings = $("#settings", main);

    const referralSections = rangeBetween(sections, referralStart, enquiryStart);
    const enquirySections = rangeBetween(sections, enquiryStart, announcements);

    sections.forEach(section => section.classList.add("admin-mobile-screen-hidden"));
    $$(".dashboard-grid > *", main).forEach(panel => panel.classList.remove("admin-mobile-panel-hidden"));

    if (name === "dashboard") {
      [hero, metrics, dashboardGrid].forEach(section => section?.classList.remove("admin-mobile-screen-hidden"));
      applications?.classList.add("admin-mobile-panel-hidden");
    } else if (name === "applications") {
      dashboardGrid?.classList.remove("admin-mobile-screen-hidden");
      $$(".dashboard-grid > *", main).forEach(panel => {
        panel.classList.toggle("admin-mobile-panel-hidden", panel !== applications);
      });
    } else if (name === "enquiries") {
      enquirySections.forEach(section => section.classList.remove("admin-mobile-screen-hidden"));
    } else if (name === "referrals") {
      referralSections.forEach(section => section.classList.remove("admin-mobile-screen-hidden"));
    } else {
      [announcements, settings].forEach(section => section?.classList.remove("admin-mobile-screen-hidden"));
    }

    $$("button[data-admin-screen]", nav).forEach(button => {
      const active = button.dataset.adminScreen === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    document.dispatchEvent(new CustomEvent("nexarvia:admin-screen-change", {
      detail: { name, visible: sections.filter(section => !section.classList.contains("admin-mobile-screen-hidden")) }
    }));

    if (shouldScroll) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function closeDrawer() {
    $("#sidebar")?.classList.remove("open");
    $("#mobileOverlay")?.classList.remove("show");
    document.body.style.overflow = "";
  }

  function initialiseMobile() {
    if (!mobileQuery.matches || mobileInitialised || !document.body.classList.contains("admin-page")) return;

    const nav = replaceBottomNav();
    const main = $(".workspace > main");
    if (!nav || !main) return;

    mobileInitialised = true;
    document.body.classList.add("admin-mobile-v41-ready");

    nav.addEventListener("click", event => {
      const button = event.target.closest("button[data-admin-screen]");
      if (!button) return;
      if (button.dataset.adminScreen === "more") {
        $("#menuToggle")?.click();
        return;
      }
      showScreen(button.dataset.adminScreen, nav);
    });

    $("#sidebar")?.addEventListener("click", event => {
      if (event.target.closest("a")) closeDrawer();
    });

    labelTables(main);
    tableObserver = new MutationObserver(() => labelTables(main));
    $$(".table-wrap tbody", main).forEach(body => {
      tableObserver.observe(body, { childList: true, subtree: true });
    });

    showScreen("dashboard", nav, false);
  }

  function restoreDesktop() {
    if (mobileQuery.matches || !mobileInitialised) return;

    mobileInitialised = false;
    tableObserver?.disconnect();
    tableObserver = null;
    document.body.classList.remove("admin-mobile-v41-ready");
    document.body.style.overflow = "";
    closeDrawer();

    const { sections } = mainSections();
    sections.forEach(section => section.classList.remove("admin-mobile-screen-hidden"));
    $$(".dashboard-grid > *").forEach(panel => panel.classList.remove("admin-mobile-panel-hidden"));

    const nav = $(".bottom-nav.admin-mobile-nav-v41");
    if (nav) location.reload();
  }

  function sync() {
    if (mobileQuery.matches) initialiseMobile();
    else restoreDesktop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sync, { once: true });
  } else {
    sync();
  }

  mobileQuery.addEventListener?.("change", sync);
})();
