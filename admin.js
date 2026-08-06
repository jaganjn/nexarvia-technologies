
const ACTIVE_MS = 75_000;
const ABANDON_MS = 150_000;
const RETAIN_MS = 24 * 60 * 60 * 1000;
const ALERT_STORAGE_KEY = "nexarviaAdminAlertSettingsV17";
const SEEN_APPLICATIONS_KEY = "nexarviaAdminSeenApplicationsV17";

const el = id => document.getElementById(id);
const E = {
  visitorList: el("visitorList"),
  onlineCount: el("onlineCount"),
  fillingCount: el("fillingCount"),
  submittedCount: el("submittedCount"),
  abandonedCount: el("abandonedCount"),
  conversionRate: el("conversionRate"),
  recentApplications: el("recentApplications"),
  topColleges: el("topColleges"),
  topDomains: el("topDomains"),
  applicationsChart: el("applicationsChart"),
  totalReferralCodes: el("totalReferralCodes"),
  successfulReferrals: el("successfulReferrals"),
  referralConversionRate: el("referralConversionRate"),
  topAmbassador: el("topAmbassador"),
  topAmbassadorCount: el("topAmbassadorCount"),
  referralLeaderboardBody: el("referralLeaderboardBody"),
  referralFriendsBody: el("referralFriendsBody"),
  referralSearch: el("referralSearch"),
  totalReferralVisits: el("totalReferralVisits"),
  totalReferralShares: el("totalReferralShares")
};

let applications = [];
let visitors = {};
let referralProfiles = {};
let referralJoins = {};
let referralEvents = {};
let referralShares = {};
let friendRows = [];
let technologyInquiries = [];
let started = false;
let initialApplicationSnapshotLoaded = false;
let soundUnlocked = false;
let audioContext = null;
let refreshInProgress = false;
let referralCodeBackfillDone = false;

const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[char]));

const asMs = value => {
  if (typeof value === "number") return value;
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
};

const fmt = value => {
  const timestamp = asMs(value);
  return timestamp
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
      }).format(new Date(timestamp))
    : "—";
};

const isToday = value => {
  const timestamp = asMs(value);
  return timestamp ? new Date(timestamp).toDateString() === new Date().toDateString() : false;
};

function getAlertSettings() {
  try {
    return {
      enabled: false,
      volume: 90,
      ...JSON.parse(localStorage.getItem(ALERT_STORAGE_KEY) || "{}")
    };
  } catch {
    return { enabled: false, volume: 90 };
  }
}

function saveAlertSettings(settings) {
  localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(settings));
}

function getSeenApplicationIds() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SEEN_APPLICATIONS_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveSeenApplicationIds(ids) {
  sessionStorage.setItem(SEEN_APPLICATIONS_KEY, JSON.stringify([...ids].slice(-1000)));
}

function showToast(title, message = "", type = "info", duration = 4200) {
  const region = el("adminToastRegion");
  if (!region) return;

  const toast = document.createElement("article");
  toast.className = `admin-toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === "success" ? "✓" : type === "error" ? "!" : "i"}</span>
    <div><strong>${esc(title)}</strong>${message ? `<small>${esc(message)}</small>` : ""}</div>
    <button type="button" aria-label="Dismiss">×</button>
  `;
  region.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));

  const remove = () => {
    toast.classList.remove("show");
    window.setTimeout(() => toast.remove(), 250);
  };
  toast.querySelector("button").addEventListener("click", remove);
  window.setTimeout(remove, duration);
}

function updateStamp(label = "Updated") {
  const target = el("lastUpdatedText");
  if (!target) return;
  target.textContent = `${label} ${new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  }).format(new Date())}`;
}

function sessionState(visitor = {}, now = Date.now()) {
  const status = String(visitor.status || "").toLowerCase();
  if (status === "submitted" || visitor.presence === "completed") return "submitted";

  const activity = asMs(visitor.lastActive) || Number(visitor.clientLastActive) || asMs(visitor.startedAt);
  const age = activity ? Math.max(0, now - activity) : Number.POSITIVE_INFINITY;
  const progress = Math.max(0, Number(visitor.formProgress || 0));
  const disconnected = ["inactive", "disconnected"].includes(String(visitor.presence || "").toLowerCase());
  const explicitlyFilling = ["filling_form", "filling", "reviewing"].includes(status);
  const hasStartedFilling = visitor.hasStartedFilling === true || progress > 0;

  if (age <= ACTIVE_MS && !disconnected) {
    return (hasStartedFilling && explicitlyFilling) || progress > 0 ? "filling" : "active";
  }
  if (hasStartedFilling || explicitlyFilling) return "abandoned";
  return "left";
}

function visitorCard(visitor, inactive = false) {
  const stateLabel = visitor.state === "filling" ? "Filling" :
    visitor.state === "abandoned" ? "Abandoned While Filling" :
    visitor.state === "left" ? "Viewer Left" : "Active Viewer";
  const displayName = visitor.fieldData?.name || visitor.name || "Anonymous Visitor";
  const displayCollege = visitor.fieldData?.college || visitor.college || visitor.page || "Application Portal";
  const lastField = visitor.currentField || (visitor.state === "left" ? "Viewing Page" : "Application form");

  return `
    <article class="visitor-card ${inactive ? "inactive-session" : ""}">
      <div class="visitor-top">
        <div>
          <strong>${esc(displayName)}</strong>
          <small>${esc(displayCollege)}</small>
        </div>
        <span class="status ${visitor.state}">${stateLabel}</span>
      </div>
      <div class="progress-bar"><span style="width:${Math.min(100, Number(visitor.formProgress || 0))}%"></span></div>
      <div class="visitor-meta">
        <span>Progress: ${Number(visitor.formProgress || 0)}%</span>
        <span>Last field: ${esc(lastField)} ${visitor.currentStep ? `• Step ${esc(visitor.currentStep)}` : ""}</span>
        <span>Last active: ${fmt(visitor.lastActive || visitor.leftAt || visitor.disconnectedAt)}</span>
        <span>Referral: ${visitor.referredBy ? `<code>${esc(visitor.referredBy)}</code>${visitor.referralVerified ? " ✓" : ""}` : "Direct visit"}</span>
      </div>
      ${inactive && visitor.exitReason ? `<p class="session-exit-reason">${esc(visitor.exitReason)}</p>` : ""}
      <div class="live-field-grid">
        <div><small>Full Name</small><strong>${esc(visitor.fieldData?.name || visitor.name || "—")}</strong></div>
        <div><small>WhatsApp</small><strong>${esc(visitor.fieldData?.phone || visitor.phone || "—")}</strong></div>
        <div><small>Email</small><strong>${esc(visitor.fieldData?.email || visitor.email || "—")}</strong></div>
        <div><small>College</small><strong>${esc(visitor.fieldData?.college || visitor.college || "—")}</strong></div>
        <div><small>Department</small><strong>${esc(visitor.fieldData?.department || visitor.department || "—")}</strong></div>
        <div><small>Year</small><strong>${esc(visitor.fieldData?.year || visitor.year || "—")}</strong></div>
        <div><small>Domain</small><strong>${esc(visitor.fieldData?.domain || visitor.domain || "—")}</strong></div>
        <div><small>Terms Consent</small><strong>${(visitor.fieldData?.consent ?? false) ? "Accepted" : "Not accepted"}</strong></div>
        <div><small>Communication</small><strong>${(visitor.fieldData?.communicationConsent ?? false) ? "Allowed" : "Not allowed"}</strong></div>
      </div>
    </article>`;
}

function renderVisitors() {
  const now = Date.now();
  const rows = Object.entries(visitors)
    .map(([id, visitor]) => ({ id, ...visitor, state: sessionState(visitor, now) }))
    .sort((a, b) => asMs(b.lastActive || b.leftAt) - asMs(a.lastActive || a.leftAt));

  const active = rows.filter(visitor => visitor.state === "active" || visitor.state === "filling");
  const filling = rows.filter(visitor => visitor.state === "filling");
  const abandoned = rows.filter(visitor => visitor.state === "abandoned");
  const recentInactive = rows.filter(visitor => ["abandoned", "left"].includes(visitor.state)).slice(0, 20);

  E.onlineCount.textContent = active.length;
  E.fillingCount.textContent = filling.length;
  E.abandonedCount.textContent = abandoned.length;
  E.submittedCount.textContent = applications.filter(app =>
    isToday(app.submittedAt || app.submittedAtMs)
  ).length;

  const periodStart = now - RETAIN_MS;
  const meaningfulSessions = rows.filter(visitor => asMs(visitor.startedAt || visitor.lastActive) >= periodStart).length;
  const recentSubmissions = applications.filter(app => asMs(app.submittedAt || app.submittedAtMs) >= periodStart).length;
  E.conversionRate.textContent = meaningfulSessions
    ? `${Math.min(100, Math.round((recentSubmissions / meaningfulSessions) * 100))}%`
    : "0%";

  const activeMarkup = active.length
    ? active.map(visitor => visitorCard(visitor)).join("")
    : '<p class="empty">No active visitors right now.</p>';

  const inactiveMarkup = recentInactive.length
    ? `<div class="inactive-session-heading"><strong>Recent exits and incomplete applications</strong><small>Saved for follow-up for up to 24 hours</small></div>${recentInactive.map(visitor => visitorCard(visitor, true)).join("")}`
    : "";

  E.visitorList.innerHTML = activeMarkup + inactiveMarkup;
  updateStamp();
}

async function cleanupStale({ removeAbandoned = false } = {}) {
  const now = Date.now();
  const updates = {};

  Object.entries(visitors).forEach(([id, visitor]) => {
    const age = now - asMs(visitor.lastActive || visitor.clientLastActive || visitor.submittedAt);
    if (visitor.status === "submitted") {
      if (age > RETAIN_MS) updates[id] = null;
      return;
    }
    const progress = Number(visitor.formProgress || 0);
    const hasStartedFilling = visitor.hasStartedFilling === true || progress > 0;

    if (removeAbandoned && age > ABANDON_MS) {
      updates[id] = null;
      return;
    }
    if (age > RETAIN_MS) {
      updates[id] = null;
    } else if (age > ABANDON_MS && hasStartedFilling) {
      updates[`${id}/status`] = "abandoned";
      updates[`${id}/presence`] = "inactive";
      updates[`${id}/abandonedAt`] = firebase.database.ServerValue.TIMESTAMP;
    } else if (age > ABANDON_MS && progress === 0) {
      updates[`${id}/status`] = "left";
      updates[`${id}/presence`] = "inactive";
      if (!visitor.leftAt) updates[`${id}/leftAt`] = firebase.database.ServerValue.TIMESTAMP;
    }
  });

  if (Object.keys(updates).length) {
    await db.ref("liveVisitors").update(updates);
  }

  return Object.values(updates).filter(value => value === null).length;
}

function renderRank(target, map) {
  const rows = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = rows[0]?.[1] || 1;

  target.innerHTML = rows.length
    ? rows.map(([name, count]) => `
      <div class="rank-item">
        <div class="rank-row"><strong>${esc(name)}</strong><small>${count}</small></div>
        <div class="rank-track"><i style="width:${(count / max) * 100}%"></i></div>
      </div>
    `).join("")
    : '<p class="empty">No data yet.</p>';
}

function renderApplications(newIds = new Set()) {
  const college = {};
  const domain = {};
  const daily = {};

  applications.forEach(app => {
    if (app.college) college[app.college] = (college[app.college] || 0) + 1;
    if (app.domain) domain[app.domain] = (domain[app.domain] || 0) + 1;
    const timestamp = asMs(app.submittedAt || app.submittedAtMs);
    if (timestamp) {
      const key = new Date(timestamp).toISOString().slice(0, 10);
      daily[key] = (daily[key] || 0) + 1;
    }
  });

  E.recentApplications.innerHTML = applications.slice(0, 10).map(app => `
    <article class="application-item ${newIds.has(app.id) ? "new-application" : ""}">
      <div class="application-top">
        <div>
          <strong>${esc(app.name || "Unknown")}</strong>
          <small>${esc(app.college || "—")} • ${esc(app.domain || "—")}</small>
        </div>
        <span class="status submitted">Submitted</span>
      </div>
      <div class="application-summary"><span>📞 ${esc(app.phone || "—")}</span><span>✉ ${esc(app.email || "—")}</span><span>🎓 ${esc(app.department || "—")} • ${esc(app.year || "—")}</span></div>
      <div class="application-summary"><span>Referred by: ${app.referredBy ? `<code>${esc(app.referredBy)}</code>` : "Direct"}</span><span>Own code: <code>${esc(app.referralCode || "—")}</code></span></div>
      <small>${fmt(app.submittedAt || app.submittedAtMs)} • Ref: ${esc(app.id)}</small>
    </article>
  `).join("") || '<p class="empty">No applications yet.</p>';

  renderRank(E.topColleges, college);
  renderRank(E.topDomains, domain);

  const days = [...Array(7)].map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
  const max = Math.max(1, ...days.map(date => daily[date.toISOString().slice(0, 10)] || 0));

  E.applicationsChart.innerHTML = days.map(date => {
    const count = daily[date.toISOString().slice(0, 10)] || 0;
    return `
      <div class="chart-day" title="${count} applications">
        <span class="chart-bar" style="height:${Math.max(4, (count / max) * 100)}%"></span>
        <small>${date.toLocaleDateString("en-IN", { weekday: "short" })}<br>${count}</small>
      </div>
    `;
  }).join("");

  renderVisitors();
  renderReferrals();
}

const reward = count =>
  count >= 10 ? "Campus Ambassador" :
  count >= 5 ? "Certificate" :
  count >= 3 ? "Priority Review" :
  "Not eligible";

async function backfillReferralCodes() {
  if (referralCodeBackfillDone || !Object.keys(referralProfiles).length) return;
  referralCodeBackfillDone = true;
  const updates = {};
  Object.entries(referralProfiles).forEach(([code, profile]) => {
    updates[code] = {
      ownerApplicationId: profile.ownerApplicationId || "legacy",
      active: true,
      createdAt: profile.createdAt || firebase.database.ServerValue.TIMESTAMP
    };
  });
  try {
    await db.ref("referralCodes").update(updates);
  } catch (error) {
    referralCodeBackfillDone = false;
    console.warn("Legacy referral-code backfill failed:", error);
  }
}

function referralEventRows(code) {
  return Object.values(referralEvents[code] || {});
}

function uniqueEventCount(code, type) {
  const keys = new Set();
  referralEventRows(code).filter(event => event?.type === type).forEach((event, index) => {
    keys.add(event.visitorId || event.applicationId || `${type}_${index}`);
  });
  return keys.size;
}

function shareCount(code) {
  return Object.keys(referralShares[code] || {}).length || referralEventRows(code).filter(event => event?.type === 'share').length;
}

function renderReferrals() {
  const codes = [...new Set([
    ...Object.keys(referralProfiles),
    ...Object.keys(referralJoins),
    ...Object.keys(referralEvents),
    ...Object.keys(referralShares)
  ])];
  const successful = Object.values(referralJoins)
    .reduce((sum, joins) => sum + Object.keys(joins || {}).length, 0);
  const totalVisits = codes.reduce((sum, code) => sum + uniqueEventCount(code, 'visit'), 0);
  const totalShares = codes.reduce((sum, code) => sum + shareCount(code), 0);

  const board = codes.map(code => ({
    code,
    ...referralProfiles[code],
    visits: uniqueEventCount(code, 'visit'),
    starts: uniqueEventCount(code, 'form_started'),
    shares: shareCount(code),
    count: Object.keys(referralJoins[code] || {}).length
  })).sort((a, b) => b.count - a.count || b.visits - a.visits);

  E.totalReferralCodes.textContent = Object.keys(referralProfiles).length;
  E.successfulReferrals.textContent = successful;
  if (E.totalReferralVisits) E.totalReferralVisits.textContent = totalVisits;
  if (E.totalReferralShares) E.totalReferralShares.textContent = totalShares;
  E.referralConversionRate.textContent = totalVisits
    ? `${Math.min(100, Math.round((successful / totalVisits) * 100))}%`
    : "0%";

  const top = board[0];
  E.topAmbassador.textContent = top?.count ? (top.ownerName || top.code) : "—";
  E.topAmbassadorCount.textContent = top?.count ? `${top.count} joined • ${top.visits} visits` : "No referrals yet";

  E.referralLeaderboardBody.innerHTML = board.length
    ? board.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${esc(item.ownerName || "Unknown")}</strong><small>${esc(item.ownerCollege || item.ownerPhone || "—")}</small></td>
        <td><code>${esc(item.code)}</code></td>
        <td>${item.visits}</td>
        <td>${item.starts}</td>
        <td>${item.shares}</td>
        <td>${item.count}</td>
        <td><span class="reward-status">${esc(reward(item.count))}</span></td>
      </tr>
    `).join("")
    : '<tr><td colspan="8" class="empty">No referral data yet.</td></tr>';

  friendRows = [];
  Object.entries(referralJoins).forEach(([code, joins]) => {
    Object.entries(joins || {}).forEach(([id, join]) => friendRows.push({ id, code, ...join }));
  });
  friendRows.sort((a, b) => asMs(b.joinedAt) - asMs(a.joinedAt));
  renderFriends(friendRows);
}

function renderFriends(rows) {
  E.referralFriendsBody.innerHTML = rows.length
    ? rows.map(item => `
      <tr>
        <td><strong>${esc(item.applicantName || "Unknown")}</strong><small>${esc(item.id)}</small></td>
        <td><code>${esc(item.code)}</code></td>
        <td>${esc(item.applicantCollege || "—")}</td>
        <td>${esc(item.applicantDomain || "—")}</td>
        <td>${fmt(item.joinedAt)}</td>
      </tr>
    `).join("")
    : '<tr><td colspan="5" class="empty">No referred applications yet.</td></tr>';
}

function unlockAudio() {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
    soundUnlocked = true;
  } catch {
    soundUnlocked = false;
  }
}

function playNotificationSound() {
  const settings = getAlertSettings();
  if (!settings.enabled) return;

  unlockAudio();
  if (!audioContext || !soundUnlocked) return;

  const now = audioContext.currentTime;
  const volume = Math.max(0.01, settings.volume / 100);
  const master = audioContext.createGain();

  // Strong two-stage alert designed to remain audible on mobile speakers.
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(volume * 0.78, now + 0.02);
  master.gain.setValueAtTime(volume * 0.78, now + 0.82);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
  master.connect(audioContext.destination);

  const notes = [
    { frequency: 880, start: 0.00, duration: 0.24, type: "square", level: 0.72 },
    { frequency: 1174.66, start: 0.18, duration: 0.30, type: "square", level: 0.72 },
    { frequency: 880, start: 0.58, duration: 0.24, type: "sawtooth", level: 0.62 },
    { frequency: 1318.51, start: 0.76, duration: 0.42, type: "square", level: 0.78 }
  ];

  notes.forEach(note => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = now + note.start;
    const end = start + note.duration;

    oscillator.type = note.type;
    oscillator.frequency.setValueAtTime(note.frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(note.level, start + 0.012);
    gain.gain.setValueAtTime(note.level, Math.max(start + 0.013, end - 0.06));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  });
}

function sendBrowserNotification(count, latest) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!document.hidden) return;

  new Notification(count === 1 ? "New Application Received" : `${count} New Applications`, {
    body: count === 1
      ? `${latest?.name || "A student"} • ${latest?.college || "New application"}`
      : "Open the admin dashboard to review the new submissions.",
    icon: "nexarvia-icon.png",
    badge: "nexarvia-icon.png",
    tag: "nexarvia-new-applications"
  });
}

function handleNewApplications(nextApplications) {
  const seen = getSeenApplicationIds();
  const currentIds = new Set(nextApplications.map(app => app.id));

  if (!initialApplicationSnapshotLoaded) {
    saveSeenApplicationIds(currentIds);
    initialApplicationSnapshotLoaded = true;
    return new Set();
  }

  const newItems = nextApplications.filter(app => !seen.has(app.id));
  if (!newItems.length) return new Set();

  newItems.forEach(app => seen.add(app.id));
  saveSeenApplicationIds(seen);

  playNotificationSound();
  showToast(
    newItems.length === 1 ? "New Application Received" : `${newItems.length} New Applications Received`,
    newItems.length === 1
      ? `${newItems[0].name || "Student"} • ${newItems[0].college || "Application submitted"}`
      : "The dashboard has been updated automatically.",
    "success",
    6000
  );
  sendBrowserNotification(newItems.length, newItems[0]);

  document.title = `(${newItems.length}) New Application${newItems.length > 1 ? "s" : ""} — Nexarvia Technologies Admin`;
  window.setTimeout(() => {
    document.title = "Nexarvia Technologies — Admin Command Center";
  }, 8000);

  return new Set(newItems.map(app => app.id));
}

async function performFullRefresh() {
  if (refreshInProgress) return;
  refreshInProgress = true;

  const button = el("refreshDashboardButton");
  const overlay = el("refreshOverlay");
  button?.classList.add("is-refreshing");
  button?.setAttribute("disabled", "disabled");
  overlay?.classList.add("show");
  overlay?.setAttribute("aria-hidden", "false");

  try {
    const removed = await cleanupStale({ removeAbandoned: true });

    const [visitorSnapshot, applicationSnapshot, referralSnapshot, joinSnapshot, eventSnapshot, shareSnapshot] = await Promise.all([
      db.ref("liveVisitors").once("value"),
      db.ref("submittedApplications").once("value"),
      db.ref("referrals").once("value"),
      db.ref("referralJoins").once("value"),
      db.ref("referralEvents").once("value"),
      db.ref("referralShares").once("value")
    ]);

    visitors = visitorSnapshot.val() || {};
    applications = Object.entries(applicationSnapshot.val() || {})
      .map(([id, app]) => ({ id, ...app }))
      .sort((a, b) => asMs(b.submittedAt || b.submittedAtMs) - asMs(a.submittedAt || a.submittedAtMs));
    referralProfiles = referralSnapshot.val() || {};
    referralJoins = joinSnapshot.val() || {};
    referralEvents = eventSnapshot.val() || {};
    referralShares = shareSnapshot.val() || {};

    renderApplications();
    renderReferrals();
    renderVisitors();
    updateStamp("Refreshed");

    showToast(
      "Dashboard refreshed",
      removed ? `${removed} abandoned or stale session${removed > 1 ? "s were" : " was"} cleared.` : "All dashboard data is up to date.",
      "success"
    );
  } catch (error) {
    console.error("Dashboard refresh failed:", error);
    showToast("Refresh failed", "Check your internet connection and Firebase access.", "error", 6000);
  } finally {
    refreshInProgress = false;
    button?.classList.remove("is-refreshing");
    button?.removeAttribute("disabled");
    overlay?.classList.remove("show");
    overlay?.setAttribute("aria-hidden", "true");
  }
}

function exportApplicationsCsv() {
  if (!applications.length) {
    showToast("Nothing to export", "No submitted applications are available.", "info");
    return;
  }

  const headers = ["Name", "Phone", "Email", "College", "Department", "Year", "Domain", "Student Referral Code", "Referred By", "Application Reference", "Submitted At"];
  const rows = applications.map(app => [
    app.name, app.phone, app.email, app.college, app.department, app.year,
    app.domain, app.referralCode || "", app.referredBy || "", app.id,
    new Date(asMs(app.submittedAt || app.submittedAtMs) || Date.now()).toISOString()
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `nexarvia-applications-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast("CSV exported", `${applications.length} applications downloaded.`, "success");
}

function updateSoundUi() {
  const settings = getAlertSettings();
  const checkbox = el("soundEnabled");
  const slider = el("notificationVolume");
  const output = el("volumeValue");
  const quick = el("soundQuickToggle");

  if (checkbox) checkbox.checked = settings.enabled;
  if (slider) slider.value = settings.volume;
  if (output) output.textContent = `${settings.volume}%`;
  if (quick) {
    quick.textContent = settings.enabled ? "🔊" : "🔇";
    quick.setAttribute("aria-pressed", String(settings.enabled));
    quick.title = settings.enabled ? "Disable notification sound" : "Enable notification sound";
  }
  if (el("soundHealthText")) el("soundHealthText").textContent = settings.enabled ? "Enabled" : "Disabled";
}

function setupNotificationSettings() {
  updateSoundUi();

  const persist = () => {
    const settings = {
      enabled: Boolean(el("soundEnabled")?.checked),
      volume: Number(el("notificationVolume")?.value || 90)
    };
    saveAlertSettings(settings);
    updateSoundUi();
  };

  el("soundEnabled")?.addEventListener("change", () => {
    unlockAudio();
    persist();
    if (el("soundEnabled").checked) {
      playNotificationSound();
      showToast("Sound alerts enabled", "A tone will play for each new application.", "success");
    }
  });

  el("notificationVolume")?.addEventListener("input", () => {
    persist();
  });

  el("testSoundButton")?.addEventListener("click", () => {
    unlockAudio();
    const settings = getAlertSettings();
    if (!settings.enabled) {
      saveAlertSettings({ ...settings, enabled: true });
      updateSoundUi();
    }
    playNotificationSound();
    showToast("Test notification", "This is the new-application alert sound.", "info");
  });

  el("soundQuickToggle")?.addEventListener("click", () => {
    unlockAudio();
    const settings = getAlertSettings();
    saveAlertSettings({ ...settings, enabled: !settings.enabled });
    updateSoundUi();
    if (!settings.enabled) playNotificationSound();
  });

  el("browserNotificationButton")?.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      showToast("Not supported", "This browser does not support system notifications.", "error");
      return;
    }
    const permission = await Notification.requestPermission();
    showToast(
      permission === "granted" ? "Browser alerts enabled" : "Permission not granted",
      permission === "granted"
        ? "Notifications can appear while the dashboard tab is in the background."
        : "You can change this later in your browser site settings.",
      permission === "granted" ? "success" : "info"
    );
  });

  document.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("keydown", unlockAudio, { once: true });
}

function setHealth(section, healthy, text) {
  const dot = el(`${section}HealthDot`);
  const label = el(`${section}HealthText`);
  dot?.classList.toggle("healthy", healthy);
  dot?.classList.toggle("unhealthy", !healthy);
  if (label) label.textContent = text;
}

function handleDataError(label, error, section) {
  console.error(`${label} Firebase access failed:`, error);
  setHealth(section, false, "Access blocked");
  showToast(`${label} unavailable`, "Deploy the included Firebase rules and confirm this admin account has access.", "error", 6500);
}



const TECHNOLOGY_INQUIRY_STATUSES = [
  ["new", "New"], ["contacted", "Contacted"], ["qualified", "Qualified"],
  ["requirements_collected", "Requirements Collected"], ["proposal_pending", "Proposal Pending"],
  ["proposal_sent", "Proposal Sent"], ["in_discussion", "In Discussion"],
  ["confirmed", "Confirmed"], ["closed", "Closed"], ["not_proceeding", "Not Proceeding"]
];

function technologyStatusLabel(status) {
  return TECHNOLOGY_INQUIRY_STATUSES.find(([value]) => value === status)?.[1] || "New";
}

function renderTechnologyInquiries(rows = technologyInquiries) {
  const body = el("technologyInquiryBody");
  if (!body) return;
  const search = String(el("technologyInquirySearch")?.value || "").trim().toLowerCase();
  const filtered = rows.filter(item => !search || [item.reference, item.fullName, item.organisation, item.email, item.phone, item.service, item.requirements]
    .some(value => String(value || "").toLowerCase().includes(search)));

  if (!filtered.length) {
    body.innerHTML = '<tr><td colspan="8" class="empty">No matching technology inquiries…</td></tr>';
  } else {
    body.innerHTML = filtered.map(item => {
      const options = TECHNOLOGY_INQUIRY_STATUSES.map(([value, label]) => `<option value="${value}" ${item.status === value ? "selected" : ""}>${label}</option>`).join("");
      return `<tr>
        <td><code class="inquiry-reference">${esc(item.reference || item.id)}</code></td>
        <td class="inquiry-client"><strong>${esc(item.fullName || "—")}</strong><small>${esc(item.organisation || item.email || "—")}</small></td>
        <td>${esc(item.service || "—")}</td><td>${esc(item.budget || "—")}</td><td>${esc(item.timeline || "—")}</td>
        <td>${fmt(item.submittedAt)}</td>
        <td><select class="inquiry-status-select" data-inquiry-status="${esc(item.id)}">${options}</select></td>
        <td><button class="inquiry-detail-toggle" type="button" data-inquiry-toggle="${esc(item.id)}">View</button></td>
      </tr><tr class="inquiry-detail-row"><td colspan="8"><div class="inquiry-detail-card" id="inquiry-detail-${esc(item.id)}">
        <div><small>Email</small><strong>${esc(item.email || "—")}</strong></div><div><small>Phone</small><strong>${esc(item.phone || "—")}</strong></div>
        <div><small>Location</small><strong>${esc(item.location || "—")}</strong></div><div><small>Preferred Contact</small><strong>${esc(item.preferredContact || "—")}</strong></div>
        <div><small>Project Type</small><strong>${esc(item.projectType || "—")}</strong></div><div><small>Budget</small><strong>${esc(item.budget || "—")}</strong></div>
        <div><small>Timeline</small><strong>${esc(item.timeline || "—")}</strong></div><div><small>Current Status</small><strong>${esc(technologyStatusLabel(item.status))}</strong></div>
        <div class="wide"><small>Requirement</small><p>${esc(item.requirements || "—")}</p></div>
        <div class="wide"><small>Internal Notes</small><textarea data-inquiry-notes="${esc(item.id)}" placeholder="Add internal notes for follow-up…">${esc(item.internalNotes || "")}</textarea><button class="panel-action" type="button" data-save-inquiry-notes="${esc(item.id)}" style="margin-top:9px">Save Notes</button></div>
      </div></td></tr>`;
    }).join("");
  }
  const all = technologyInquiries;
  if (el("technologyInquiryTotal")) el("technologyInquiryTotal").textContent = all.length;
  if (el("technologyInquiryNew")) el("technologyInquiryNew").textContent = all.filter(x => !x.status || x.status === "new").length;
  if (el("technologyInquiryQualified")) el("technologyInquiryQualified").textContent = all.filter(x => ["qualified","requirements_collected"].includes(x.status)).length;
  if (el("technologyInquiryProposal")) el("technologyInquiryProposal").textContent = all.filter(x => ["proposal_pending","proposal_sent","in_discussion"].includes(x.status)).length;
  if (el("technologyInquiryConfirmed")) el("technologyInquiryConfirmed").textContent = all.filter(x => x.status === "confirmed").length;
}

function setupTechnologyInquiryListener() {
  db.ref("technologyServiceInquiries").on("value", snapshot => {
    technologyInquiries = Object.entries(snapshot.val() || {}).map(([id, item]) => ({ id, ...item })).sort((a,b) => asMs(b.submittedAt) - asMs(a.submittedAt));
    renderTechnologyInquiries(); setHealth("inquiries", true, "Receiving data");
  }, error => handleDataError("Technology inquiries", error, "inquiries"));
}

async function updateTechnologyInquiryStatus(id, status) {
  await db.ref(`technologyServiceInquiries/${id}`).update({status, updatedAt: firebase.database.ServerValue.TIMESTAMP});
  showToast("Inquiry status updated", technologyStatusLabel(status), "success");
}

async function saveTechnologyInquiryNotes(id) {
  const notes = document.querySelector(`[data-inquiry-notes="${CSS.escape(id)}"]`)?.value || "";
  await db.ref(`technologyServiceInquiries/${id}`).update({internalNotes: notes.trim().slice(0,4000), updatedAt: firebase.database.ServerValue.TIMESTAMP});
  showToast("Inquiry notes saved", id, "success");
}

function exportTechnologyInquiriesCsv() {
  if (!technologyInquiries.length) return showToast("Nothing to export", "No Technology Services inquiries are available.", "info");
  const headers = ["Reference","Full Name","Organisation","Email","Phone","Location","Service","Project Type","Budget","Timeline","Preferred Contact","Requirements","Status","Submitted At","Internal Notes"];
  const quote = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(quote).join(","), ...technologyInquiries.map(i => [i.reference,i.fullName,i.organisation,i.email,i.phone,i.location,i.service,i.projectType,i.budget,i.timeline,i.preferredContact,i.requirements,technologyStatusLabel(i.status),new Date(asMs(i.submittedAt)||0).toISOString(),i.internalNotes].map(quote).join(","))];
  const blob = new Blob(["\ufeff" + lines.join("\n")], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `Nexarvia-Technology-Inquiries-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  showToast("CSV exported", `${technologyInquiries.length} inquiries downloaded.`, "success");
}

function deleteTechnologyInquiries() {
  return del("technologyServiceInquiries", "Delete all Technology Services inquiries?");
}

function listeners() {
  if (started) return;
  started = true;
  setupTechnologyInquiryListener();

  const visitorRoot = db.ref("liveVisitors");
  const applyVisitor = snapshot => {
    const value = snapshot.val();
    if (value) visitors[snapshot.key] = value;
    else delete visitors[snapshot.key];
    renderVisitors();
  };

  visitorRoot.once("value").then(snapshot => {
    visitors = snapshot.val() || {};
    renderVisitors();
    setHealth("tracking", true, "Receiving data");
  }).catch(error => handleDataError("Live tracking", error, "tracking"));
  visitorRoot.on("child_added", applyVisitor);
  visitorRoot.on("child_changed", applyVisitor);
  visitorRoot.on("child_removed", snapshot => {
    delete visitors[snapshot.key];
    renderVisitors();
  });

  db.ref("submittedApplications").on("value", snapshot => {
    const nextApplications = Object.entries(snapshot.val() || {})
      .map(([id, app]) => ({ id, ...app }))
      .sort((a, b) => asMs(b.submittedAtMs || b.submittedAt) - asMs(a.submittedAtMs || a.submittedAt));

    const newIds = handleNewApplications(nextApplications);
    applications = nextApplications;
    renderApplications(newIds);
    setHealth("applications", true, "Receiving data");
  }, error => handleDataError("Applications", error, "applications"));

  db.ref("referrals").on("value", snapshot => {
    referralProfiles = snapshot.val() || {};
    backfillReferralCodes();
    renderReferrals();
    setHealth("referral", true, "Receiving data");
  }, error => handleDataError("Referrals", error, "referral"));

  db.ref("referralJoins").on("value", snapshot => {
    referralJoins = snapshot.val() || {};
    renderReferrals();
  }, error => handleDataError("Referral joins", error, "referral"));

  db.ref("referralEvents").on("value", snapshot => {
    referralEvents = snapshot.val() || {};
    renderReferrals();
  }, error => handleDataError("Referral events", error, "referral"));

  db.ref("referralShares").on("value", snapshot => {
    referralShares = snapshot.val() || {};
    renderReferrals();
  }, error => handleDataError("Referral shares", error, "referral"));

  window.setInterval(() => renderVisitors(), 5_000);
  window.setInterval(() => cleanupStale().catch(console.warn), 30_000);

  E.referralSearch?.addEventListener("input", () => {
    const query = E.referralSearch.value.toLowerCase();
    renderFriends(friendRows.filter(item =>
      [item.applicantName, item.code, item.applicantCollege, item.applicantDomain]
        .some(value => String(value || "").toLowerCase().includes(query))
    ));
  });
}

function setupUI() {
  const sidebar = el("sidebar");
  const overlay = el("mobileOverlay");
  const toggle = () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show");
  };

  el("menuToggle")?.addEventListener("click", toggle);
  el("moreNav")?.addEventListener("click", toggle);
  overlay?.addEventListener("click", toggle);

  document.querySelectorAll(".side-nav a").forEach(anchor => {
    anchor.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    });
  });

  const tick = () => {
    const date = new Date();
    el("liveClock").textContent = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    el("liveDate").textContent = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };
  tick();
  window.setInterval(tick, 1000);

  el("refreshDashboardButton")?.addEventListener("click", performFullRefresh);
  el("exportApplicationsButton")?.addEventListener("click", exportApplicationsCsv);
  el("exportTechnologyInquiries")?.addEventListener("click", exportTechnologyInquiriesCsv);
  el("technologyInquirySearch")?.addEventListener("input", () => renderTechnologyInquiries());
  el("technologyInquiryBody")?.addEventListener("change", event => { const id = event.target?.dataset?.inquiryStatus; if (id) updateTechnologyInquiryStatus(id, event.target.value).catch(error => showToast("Status update failed", error.message, "error")); });
  el("technologyInquiryBody")?.addEventListener("click", event => { const toggleId = event.target?.dataset?.inquiryToggle; if (toggleId) el(`inquiry-detail-${toggleId}`)?.classList.toggle("is-open"); const saveId = event.target?.dataset?.saveInquiryNotes; if (saveId) saveTechnologyInquiryNotes(saveId).catch(error => showToast("Notes update failed", error.message, "error")); });
  setupNotificationSettings();

  db.ref(".info/connected").on("value", snapshot => {
    const live = snapshot.val() === true;
    el("portalLiveStatus").classList.toggle("is-offline", !live);
    el("portalLiveText").textContent = live ? "Firebase Live" : "Reconnecting";
    el("firebaseHealthDot")?.classList.toggle("healthy", live);
    el("firebaseHealthDot")?.classList.toggle("unhealthy", !live);
    if (el("firebaseHealthText")) el("firebaseHealthText").textContent = live ? "Connected" : "Offline";
  });
}

function setAdminAuthGate(state, title, message) {
  const gate = document.getElementById("adminAuthGate");
  const titleEl = document.getElementById("adminAuthGateTitle");
  const messageEl = document.getElementById("adminAuthGateMessage");
  const actions = document.getElementById("adminAuthGateActions");
  if (!gate) return;
  gate.dataset.state = state;
  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  if (actions) actions.hidden = state !== "error";
  gate.hidden = state === "ready";
}

function initialiseAdminAccess() {
  const retry = document.getElementById("adminAuthRetry");
  retry?.addEventListener("click", () => location.reload());
  setAdminAuthGate("checking", "Checking administrator session…", "Please wait while Firebase Authentication verifies secure access.");

  if (typeof auth === "undefined" || !auth || typeof auth.onAuthStateChanged !== "function") {
    setAdminAuthGate("error", "Authentication service unavailable", "Firebase Authentication could not be loaded. Check the Firebase scripts and deployed-domain configuration.");
    return;
  }
  if (typeof db === "undefined" || !db) {
    setAdminAuthGate("error", "Database service unavailable", "Firebase Realtime Database could not be initialised. Verify firebase.js and your project configuration.");
    return;
  }

  let settled = false;
  const timeout = window.setTimeout(() => {
    if (settled) return;
    setAdminAuthGate("error", "Session verification timed out", "The authentication check took too long. Check your connection, authorised domain and API-key restrictions, then retry.");
  }, 10000);

  auth.onAuthStateChanged(user => {
    settled = true;
    window.clearTimeout(timeout);
    if (!user) {
      setAdminAuthGate("checking", "Administrator login required", "Redirecting to the secure login page…");
      window.setTimeout(() => location.replace("login.html"), 350);
      return;
    }
    try {
      setupUI();
      listeners();
      setAdminAuthGate("ready", "Access verified", "Dashboard ready.");
    } catch (error) {
      console.error("Admin dashboard initialisation failed:", error);
      setAdminAuthGate("error", "Dashboard could not initialise", error?.message || "A dashboard script failed before the data views could load.");
    }
  }, error => {
    settled = true;
    window.clearTimeout(timeout);
    console.error("Admin authentication error:", error);
    setAdminAuthGate("error", "Unable to verify administrator access", error?.message || "Firebase Authentication returned an error.");
  });
}

window.addEventListener("error", event => {
  const gate = document.getElementById("adminAuthGate");
  if (gate && !gate.hidden) {
    setAdminAuthGate("error", "Dashboard script error", event.message || "A script failed while loading the dashboard.");
  }
});

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", initialiseAdminAccess, { once: true })
  : initialiseAdminAccess();

function logout() {
  auth.signOut().then(() => location.replace("login.html"));
}

async function del(path, message) {
  if (confirm(message)) await db.ref(path).remove();
}

function deleteLiveVisitors() {
  return del("liveVisitors", "Delete all live tracking data?");
}

function deleteApplications() {
  return del("submittedApplications", "Delete all submitted applications?");
}

function deleteReferralData() {
  if (confirm("Delete all referral data?")) {
    return Promise.all([
      db.ref("referrals").remove(),
      db.ref("referralCodes").remove(),
      db.ref("referralJoins").remove(),
      db.ref("referralEvents").remove(),
      db.ref("referralShares").remove()
    ]);
  }
}

function resetDashboard() {
  if (confirm("Reset all dashboard data?")) {
    return Promise.all([
      db.ref("liveVisitors").remove(),
      db.ref("submittedApplications").remove(),
      db.ref("referrals").remove(),
      db.ref("referralCodes").remove(),
      db.ref("referralJoins").remove(),
      db.ref("referralEvents").remove(),
      db.ref("referralShares").remove(),
      db.ref("technologyServiceInquiries").remove()
    ]);
  }
}


/* =========================================================
   FINAL EXTENSION — REAL-TIME INQUIRY CHARTS, OPERATIONS
   NOTIFICATION CENTRE AND PUBLIC WEBSITE ANNOUNCEMENTS
   ========================================================= */
(() => {
  const q=id=>document.getElementById(id);
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const ms=v=>typeof v==='number'?v:(Date.parse(v||'')||0);
  let apps=[], inquiries=[], announcements=[];
  const seenKey='nexarviaAdminNotificationSeenFinal';

  function renderInquiryAnalytics(){
    const chart=q('technologyInquiryRealtimeChart'),breakdown=q('technologyServiceBreakdown');if(!chart||!breakdown)return;
    const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(6-i));return d});
    const values=days.map(d=>inquiries.filter(x=>{const t=ms(x.submittedAt);return t>=d.getTime()&&t<d.getTime()+86400000}).length);const max=Math.max(1,...values);
    chart.innerHTML=values.some(Boolean)?days.map((d,i)=>`<div class="realtime-bar"><i style="height:${Math.max(4,Math.round(values[i]/max*180))}px"><span>${values[i]}</span></i><small>${d.toLocaleDateString('en-IN',{weekday:'short'})}</small></div>`).join(''):'<p class="empty">No enquiry submissions in the last seven days.</p>';
    const groups={};inquiries.forEach(x=>{const k=x.service||'Not specified';groups[k]=(groups[k]||0)+1});const entries=Object.entries(groups).sort((a,b)=>b[1]-a[1]).slice(0,7),top=Math.max(1,...entries.map(x=>x[1]));breakdown.innerHTML=entries.length?entries.map(([name,count])=>`<article><strong>${safe(name)}</strong><div><i style="width:${Math.round(count/top*100)}%"></i></div><b>${count}</b></article>`).join(''):'<p class="empty">No service-demand data yet.</p>';
  }
  function combined(){return [...apps.map(x=>({type:'Learning application',title:x.name||'New learner application',message:`${x.domain||'Programme interest'} · ${x.college||x.currentStatus||'Learner profile'}`,time:ms(x.submittedAtMs||x.submittedAt)})),...inquiries.map(x=>({type:'Technology enquiry',title:x.fullName||'New business enquiry',message:`${x.service||'Service requirement'} · ${x.organisation||x.reference||''}`,time:ms(x.submittedAt)}))].sort((a,b)=>b.time-a.time).slice(0,20)}
  function renderNotifications(){const list=q('adminNotificationList'),count=q('adminNotificationCount');if(!list||!count)return;const items=combined();list.innerHTML=items.length?items.map(x=>`<article class="admin-alert-item"><small class="admin-alert-type">${safe(x.type)}</small><strong>${safe(x.title)}</strong><p>${safe(x.message)}</p><small>${x.time?new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(x.time)):'—'}</small></article>`).join(''):'<div class="admin-alert-empty">No applications or enquiries yet.</div>';let seen=0;try{seen=Number(localStorage.getItem(seenKey)||0)}catch{}const unread=items.filter(x=>x.time>seen).length;count.textContent=String(Math.min(unread,99));count.classList.toggle('has-items',unread>0)}
  function renderAnnouncements(){const list=q('announcementList');if(!list)return;list.innerHTML=announcements.length?announcements.sort((a,b)=>ms(b.createdAt)-ms(a.createdAt)).map(x=>`<article class="announcement-item"><div><strong>${safe(x.title||'Notice')}</strong><p>${safe(x.message||'')}</p><small>${safe(x.audience||'all')} · ${new Date(ms(x.createdAt)||Date.now()).toLocaleString('en-IN')}</small></div><button type="button" data-delete-announcement="${safe(x.id)}">Delete</button></article>`).join(''):'<p class="empty">No public announcements.</p>'}
  function setupUi(){const btn=q('adminNotificationButton'),drawer=q('adminNotificationDrawer'),close=q('adminNotificationClose');const set=open=>{drawer?.classList.toggle('is-open',open);drawer?.setAttribute('aria-hidden',String(!open));if(open){try{localStorage.setItem(seenKey,String(Date.now()))}catch{}renderNotifications()}};btn?.addEventListener('click',()=>set(!drawer?.classList.contains('is-open')));close?.addEventListener('click',()=>set(false));q('announcementForm')?.addEventListener('submit',async e=>{e.preventDefault();const title=q('announcementTitle').value.trim(),message=q('announcementMessage').value.trim(),audience=q('announcementAudience').value;if(!title||!message)return;await db.ref('publicAnnouncements').push({title,message,audience,active:true,createdAt:firebase.database.ServerValue.TIMESTAMP});e.target.reset();if(typeof showToast==='function')showToast('Website notice published',audience,'success')});q('announcementList')?.addEventListener('click',e=>{const id=e.target?.dataset?.deleteAnnouncement;if(id&&confirm('Delete this website notice?'))db.ref(`publicAnnouncements/${id}`).remove()})}
  auth.onAuthStateChanged(user=>{if(!user)return;setupUi();db.ref('submittedApplications').on('value',s=>{apps=Object.values(s.val()||{});renderNotifications()});db.ref('technologyServiceInquiries').on('value',s=>{inquiries=Object.values(s.val()||{});renderInquiryAnalytics();renderNotifications()});db.ref('publicAnnouncements').on('value',s=>{announcements=Object.entries(s.val()||{}).map(([id,x])=>({id,...x}));renderAnnouncements()})});
})();
