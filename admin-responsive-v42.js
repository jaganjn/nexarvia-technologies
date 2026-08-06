(() => {
  "use strict";

  const mobileQuery = window.matchMedia("(max-width: 820px)");
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const icons = {
    overview: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    applications: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v4H7z"/><rect x="5" y="5" width="14" height="16" rx="2"/><path d="M8 11h8M8 15h8"/></svg>',
    enquiries: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5Z"/><path d="M8 9h8M8 13h5"/></svg>',
    referrals: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="7" r="2"/><path d="M3 20c0-4 2-6 5-6s5 2 5 6M14 14c3 0 5 2 5 5"/></svg>',
    more: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };

  const viewCopy = {
    overview: ["Operations Overview", "Live activity, performance and system health"],
    applications: ["Learning Applications", "Recent submissions and domain demand"],
    visitors: ["Live Visitors", "Active sessions and application progress"],
    enquiries: ["Business Enquiries", "Technology Services pipeline and requirements"],
    referrals: ["Referral Performance", "Codes, joins, ambassadors and rewards"],
    analytics: ["Operational Analytics", "Seven-day activity, colleges and domains"],
    announcements: ["Website Announcements", "Publish notices across Nexarvia pages"],
    settings: ["Settings & Data", "Alerts, service health and data controls"]
  };

  let mobileInitialised = false;
  let tableObserver = null;
  let nav = null;
  let viewbar = null;
  let moreSheet = null;
  let moreOverlay = null;
  let activeView = "overview";

  function mainSections() {
    const main = $(".workspace > main");
    return { main, sections: main ? [...main.children].filter(node => node.nodeType === Node.ELEMENT_NODE) : [] };
  }

  function rangeBetween(sections, start, stopBefore) {
    const startIndex = sections.indexOf(start);
    const stopIndex = sections.indexOf(stopBefore);
    if (startIndex < 0) return [];
    return sections.slice(startIndex, stopIndex < 0 ? sections.length : stopIndex);
  }

  function labelTables(root = document) {
    $$(".table-wrap table", root).forEach(table => {
      const headings = $$("thead th", table).map(cell => cell.textContent.trim());
      $$("tbody tr", table).forEach(row => {
        [...row.children].forEach((cell, index) => {
          if (!cell.hasAttribute("colspan")) cell.dataset.label = headings[index] || "Detail";
        });
      });
    });
  }

  function makeBottomNav() {
    const current = $(".bottom-nav");
    if (!current) return null;
    current.className = "bottom-nav admin-mobile-nav-v42";
    current.setAttribute("aria-label", "Mobile admin navigation");
    current.innerHTML = [
      ["overview", "Overview"], ["applications", "Applications"], ["enquiries", "Enquiries"],
      ["referrals", "Referrals"], ["more", "More"]
    ].map(([target, label], index) => `
      <button type="button" data-admin-view="${target}" class="${index === 0 ? "is-active" : ""}" aria-pressed="${index === 0}">
        ${icons[target]}<span>${label}</span>
      </button>`).join("");
    return current;
  }

  function makeViewbar() {
    const workspace = $(".workspace");
    const main = $(".workspace > main");
    if (!workspace || !main) return null;
    const bar = document.createElement("div");
    bar.className = "admin-mobile-viewbar";
    bar.innerHTML = '<div><strong id="adminMobileViewTitle">Operations Overview</strong><small id="adminMobileViewCopy">Live activity, performance and system health</small></div><button type="button" id="adminMobileRefresh" aria-label="Refresh dashboard">↻</button>';
    workspace.insertBefore(bar, main);
    $("#adminMobileRefresh", bar)?.addEventListener("click", () => $("#refreshDashboardButton")?.click());
    return bar;
  }

  function makeMoreSheet() {
    moreOverlay = document.createElement("div");
    moreOverlay.className = "admin-more-overlay";
    moreOverlay.setAttribute("aria-hidden", "true");

    moreSheet = document.createElement("aside");
    moreSheet.className = "admin-more-sheet";
    moreSheet.setAttribute("aria-hidden", "true");
    moreSheet.setAttribute("aria-label", "More admin options");
    moreSheet.innerHTML = `
      <div class="admin-more-head"><strong>More Admin Tools</strong><button type="button" data-close-more aria-label="Close more menu">×</button></div>
      <div class="admin-more-grid">
        <button type="button" data-sheet-view="visitors"><i>◉</i><span><b>Live Visitors</b><small>Sessions and form progress</small></span></button>
        <button type="button" data-sheet-view="analytics"><i>⌁</i><span><b>Analytics</b><small>Trends, colleges and domains</small></span></button>
        <button type="button" data-sheet-view="announcements"><i>✦</i><span><b>Announcements</b><small>Publish website notices</small></span></button>
        <button type="button" data-sheet-view="settings"><i>⚙</i><span><b>Settings & Data</b><small>Alerts, health and controls</small></span></button>
        <a href="learning.html"><i>↗</i><span><b>Learning Website</b><small>Open Nexarvia Learning</small></span></a>
        <a href="technology-services.html"><i>▦</i><span><b>Technology Services</b><small>Open services website</small></span></a>
        <a href="privacy.html"><i>◌</i><span><b>Privacy</b><small>Privacy notice</small></span></a>
        <a href="terms.html"><i>▤</i><span><b>Terms</b><small>Website terms</small></span></a>
        <button type="button" class="danger" data-admin-logout><i>↪</i><span><b>Sign Out</b><small>End administrator session</small></span></button>
      </div>`;
    document.body.append(moreOverlay, moreSheet);

    moreOverlay.addEventListener("click", closeMore);
    $("[data-close-more]", moreSheet)?.addEventListener("click", closeMore);
    moreSheet.addEventListener("click", event => {
      const viewButton = event.target.closest("[data-sheet-view]");
      if (viewButton) {
        showView(viewButton.dataset.sheetView);
        closeMore();
      }
      if (event.target.closest("[data-admin-logout]")) {
        closeMore();
        if (typeof window.logout === "function") window.logout();
      }
    });
  }

  function openMore() {
    if (!moreSheet || !moreOverlay) return;
    moreSheet.classList.add("is-open");
    moreOverlay.classList.add("is-open");
    moreSheet.setAttribute("aria-hidden", "false");
    moreOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    updateNav("more");
  }

  function closeMore() {
    moreSheet?.classList.remove("is-open");
    moreOverlay?.classList.remove("is-open");
    moreSheet?.setAttribute("aria-hidden", "true");
    moreOverlay?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    updateNav(["overview", "applications", "enquiries", "referrals"].includes(activeView) ? activeView : "more");
  }

  function closeDrawer() {
    $("#sidebar")?.classList.remove("open");
    $("#mobileOverlay")?.classList.remove("show");
    document.body.style.overflow = "";
  }

  function updateNav(name) {
    $$('[data-admin-view]', nav || document).forEach(button => {
      const active = button.dataset.adminView === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function updateViewbar(name) {
    const [title, copy] = viewCopy[name] || viewCopy.overview;
    const titleEl = $("#adminMobileViewTitle", viewbar || document);
    const copyEl = $("#adminMobileViewCopy", viewbar || document);
    if (titleEl) titleEl.textContent = title;
    if (copyEl) copyEl.textContent = copy;
  }

  function showView(name, shouldScroll = true) {
    const { main, sections } = mainSections();
    if (!mobileQuery.matches || !main || !sections.length) return;

    const hero = $("#dashboard", main);
    const metrics = $(".metric-grid", main);
    const dashboardGrid = $(".dashboard-grid", main);
    const activity = $("#activity", main);
    const colleges = $("#analytics", main);
    const visitors = $("#liveVisitors", main);
    const applications = $("#applications", main);
    const domains = $("#applicationsByDomain", main);
    const referralStart = $("#referralOverview", main);
    const enquiryStart = $("#technologyInquiries", main);
    const announcements = $("#announcements", main);
    const settings = $("#settings", main);
    const referralSections = rangeBetween(sections, referralStart, enquiryStart);
    const enquirySections = rangeBetween(sections, enquiryStart, announcements);

    sections.forEach(section => section.classList.add("v42-screen-hidden"));
    $$(".dashboard-grid > *", main).forEach(panel => panel.classList.add("v42-panel-hidden"));

    if (name === "overview") {
      [hero, metrics, dashboardGrid].forEach(section => section?.classList.remove("v42-screen-hidden"));
      [activity, colleges, visitors, domains].forEach(panel => panel?.classList.remove("v42-panel-hidden"));
    } else if (name === "applications") {
      dashboardGrid?.classList.remove("v42-screen-hidden");
      [applications, domains].forEach(panel => panel?.classList.remove("v42-panel-hidden"));
    } else if (name === "visitors") {
      dashboardGrid?.classList.remove("v42-screen-hidden");
      visitors?.classList.remove("v42-panel-hidden");
    } else if (name === "analytics") {
      dashboardGrid?.classList.remove("v42-screen-hidden");
      [activity, colleges, domains].forEach(panel => panel?.classList.remove("v42-panel-hidden"));
    } else if (name === "enquiries") {
      enquirySections.forEach(section => section.classList.remove("v42-screen-hidden"));
    } else if (name === "referrals") {
      referralSections.forEach(section => section.classList.remove("v42-screen-hidden"));
    } else if (name === "announcements") {
      announcements?.classList.remove("v42-screen-hidden");
    } else if (name === "settings") {
      settings?.classList.remove("v42-screen-hidden");
    } else {
      name = "overview";
      [hero, metrics, dashboardGrid].forEach(section => section?.classList.remove("v42-screen-hidden"));
      [activity, colleges, visitors, domains].forEach(panel => panel?.classList.remove("v42-panel-hidden"));
    }

    activeView = name;
    updateViewbar(name);
    updateNav(["overview", "applications", "enquiries", "referrals"].includes(name) ? name : "more");
    labelTables(main);

    const visible = sections.filter(section => !section.classList.contains("v42-screen-hidden"));
    document.dispatchEvent(new CustomEvent("nexarvia:admin-screen-change", { detail: { name, visible } }));
    if (shouldScroll) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function routeForHash(hash) {
    const routes = {
      "#dashboard": "overview", "#liveVisitors": "visitors", "#activity": "analytics", "#analytics": "analytics",
      "#applications": "applications", "#technologyInquiries": "enquiries", "#referralOverview": "referrals",
      "#referralLeaderboard": "referrals", "#referralFriends": "referrals", "#announcements": "announcements", "#settings": "settings"
    };
    return routes[hash] || "overview";
  }

  function initialiseMobile() {
    if (!mobileQuery.matches || mobileInitialised || !document.body.classList.contains("admin-page")) return;
    nav = makeBottomNav();
    const main = $(".workspace > main");
    if (!nav || !main) return;

    mobileInitialised = true;
    document.body.classList.add("admin-mobile-v42-ready");
    viewbar = makeViewbar();
    makeMoreSheet();

    nav.addEventListener("click", event => {
      const button = event.target.closest("button[data-admin-view]");
      if (!button) return;
      if (button.dataset.adminView === "more") openMore();
      else showView(button.dataset.adminView);
    });

    $("#sidebar")?.addEventListener("click", event => {
      const link = event.target.closest("a[href^='#']");
      if (!link) return;
      event.preventDefault();
      showView(routeForHash(link.getAttribute("href")));
      closeDrawer();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") { closeMore(); closeDrawer(); }
    });

    labelTables(main);
    tableObserver = new MutationObserver(() => labelTables(main));
    $$(".table-wrap tbody", main).forEach(body => tableObserver.observe(body, { childList: true, subtree: true }));
    showView(routeForHash(location.hash), false);
  }

  function restoreDesktop() {
    if (mobileQuery.matches || !mobileInitialised) return;
    mobileInitialised = false;
    tableObserver?.disconnect();
    tableObserver = null;
    document.body.classList.remove("admin-mobile-v42-ready");
    document.body.style.overflow = "";
    closeDrawer();
    closeMore();
    viewbar?.remove(); viewbar = null;
    moreSheet?.remove(); moreSheet = null;
    moreOverlay?.remove(); moreOverlay = null;

    const { sections } = mainSections();
    sections.forEach(section => section.classList.remove("v42-screen-hidden"));
    $$(".dashboard-grid > *").forEach(panel => panel.classList.remove("v42-panel-hidden"));

    const mobileNav = $(".bottom-nav.admin-mobile-nav-v42");
    if (mobileNav) location.reload();
  }

  function sync() { mobileQuery.matches ? initialiseMobile() : restoreDesktop(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", sync, { once: true });
  else sync();
  mobileQuery.addEventListener?.("change", sync);
})();
