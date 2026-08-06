(() => {
  "use strict";

  const phrase = "DELETE ALL DATA";
  const allDataSpecs = [
    { path: "liveVisitors", depth: 1 },
    { path: "submittedApplications", depth: 1 },
    { path: "referrals", depth: 1 },
    { path: "referralCodes", depth: 1 },
    { path: "referralJoins", depth: 2 },
    { path: "referralEvents", depth: 2 },
    { path: "referralShares", depth: 2 },
    { path: "technologyServiceInquiries", depth: 1 },
    { path: "publicAnnouncements", depth: 1 }
  ];

  let dialog;
  let input;
  let confirmButton;
  let status;

  function ensureAdminServices() {
    if (typeof auth === "undefined" || !auth?.currentUser) throw new Error("Administrator authentication is required.");
    if (typeof db === "undefined" || !db?.ref) throw new Error("Firebase Database is unavailable.");
  }

  function collectDeleteUpdates(snapshot, basePath, depth, parts, updates) {
    if (!snapshot.exists()) return;
    if (depth <= 0) {
      updates[[basePath, ...parts].join("/")] = null;
      return;
    }
    snapshot.forEach(child => collectDeleteUpdates(child, basePath, depth - 1, [...parts, child.key], updates));
  }

  async function buildDeleteUpdates(specs) {
    ensureAdminServices();
    const updates = {};
    await Promise.all(specs.map(async spec => {
      const snapshot = await db.ref(spec.path).once("value");
      collectDeleteUpdates(snapshot, spec.path, spec.depth, [], updates);
    }));
    return updates;
  }

  async function removeData(specs) {
    const updates = await buildDeleteUpdates(specs);
    const count = Object.keys(updates).length;
    if (count) await db.ref().update(updates);
    return count;
  }

  function notify(title, message, type = "success") {
    if (typeof window.showToast === "function") window.showToast(title, message, type);
  }

  async function clearWithConfirmation(specs, promptText, successText) {
    if (!window.confirm(promptText)) return;
    try {
      const count = await removeData(specs);
      notify(count ? "Data deleted" : "Nothing to delete", count ? successText : "No matching records were found.", count ? "success" : "info");
    } catch (error) {
      console.error("Admin data deletion failed:", error);
      notify("Delete failed", error?.message || "Check Firebase rules and try again.", "error");
    }
  }

  function createDialog() {
    if (dialog) return dialog;
    dialog = document.createElement("div");
    dialog.className = "admin-data-dialog";
    dialog.id = "adminDataDialog";
    dialog.hidden = true;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "adminDataDialogTitle");
    dialog.innerHTML = `
      <div class="admin-data-dialog__card">
        <span class="admin-data-dialog__icon" aria-hidden="true">!</span>
        <h2 id="adminDataDialogTitle">Clear all current dashboard data?</h2>
        <p>This permanently removes operational records from Firebase. Administrator accounts and website source files are not deleted.</p>
        <ul>
          <li>Learning applications and live visitor sessions</li>
          <li>Technology Services enquiries</li>
          <li>Referral codes, events, shares and joins</li>
          <li>Published website announcements</li>
        </ul>
        <label for="adminDataConfirmInput">Type <strong>${phrase}</strong> to continue
          <input id="adminDataConfirmInput" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" />
        </label>
        <p class="admin-data-dialog__status" id="adminDataDialogStatus" aria-live="polite"></p>
        <div class="admin-data-dialog__actions">
          <button class="admin-data-dialog__cancel" id="adminDataCancel" type="button">Cancel</button>
          <button class="admin-data-dialog__confirm" id="adminDataConfirm" type="button" disabled>Delete All Current Data</button>
        </div>
      </div>`;
    document.body.append(dialog);
    input = dialog.querySelector("#adminDataConfirmInput");
    confirmButton = dialog.querySelector("#adminDataConfirm");
    status = dialog.querySelector("#adminDataDialogStatus");

    input.addEventListener("input", () => {
      confirmButton.disabled = input.value.trim().toUpperCase() !== phrase;
      status.textContent = "";
    });
    dialog.querySelector("#adminDataCancel").addEventListener("click", closeDialog);
    dialog.addEventListener("click", event => { if (event.target === dialog) closeDialog(); });
    confirmButton.addEventListener("click", clearAllData);
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !dialog.hidden) closeDialog(); });
    return dialog;
  }

  function openDialog() {
    createDialog();
    input.value = "";
    confirmButton.disabled = true;
    confirmButton.dataset.busy = "false";
    confirmButton.textContent = "Delete All Current Data";
    status.textContent = "";
    dialog.hidden = false;
    document.body.classList.add("admin-data-dialog-open");
    window.setTimeout(() => input.focus(), 40);
  }

  function closeDialog() {
    if (!dialog || confirmButton?.dataset.busy === "true") return;
    dialog.hidden = true;
    document.body.classList.remove("admin-data-dialog-open");
  }

  async function clearAllData() {
    if (input.value.trim().toUpperCase() !== phrase) return;

    confirmButton.disabled = true;
    confirmButton.dataset.busy = "true";
    confirmButton.textContent = "Deleting…";
    status.textContent = "Removing current dashboard records from Firebase…";

    try {
      const count = await removeData(allDataSpecs);
      status.textContent = count
        ? `Deleted ${count} current record${count === 1 ? "" : "s"} successfully.`
        : "There were no current records to delete.";
      notify(count ? "Dashboard data cleared" : "Dashboard already clear", count
        ? "Applications, enquiries, tracking, referrals and announcements were removed."
        : "No current dashboard records were found.", count ? "success" : "info");
      window.setTimeout(() => {
        confirmButton.dataset.busy = "false";
        closeDialog();
        document.getElementById("refreshDashboardButton")?.click();
      }, 900);
    } catch (error) {
      console.error("Clear all dashboard data failed:", error);
      status.textContent = error?.message || "The data could not be deleted. Check Firebase rules and try again.";
      confirmButton.dataset.busy = "false";
      confirmButton.disabled = false;
      confirmButton.textContent = "Try Delete Again";
    }
  }

  function bind() {
    createDialog();
    document.getElementById("clearAllDashboardDataButton")?.addEventListener("click", openDialog);
    window.addEventListener("nexarvia:open-clear-data", openDialog);

    // Override the older parent-level remove actions. These delete permitted child records,
    // so they continue to work with the included path-specific Firebase rules.
    window.deleteLiveVisitors = () => clearWithConfirmation(
      [{ path: "liveVisitors", depth: 1 }],
      "Delete all live tracking data?",
      "All live visitor sessions were removed."
    );
    window.deleteApplications = () => clearWithConfirmation(
      [{ path: "submittedApplications", depth: 1 }],
      "Delete all submitted applications?",
      "All submitted applications were removed."
    );
    window.deleteTechnologyInquiries = () => clearWithConfirmation(
      [{ path: "technologyServiceInquiries", depth: 1 }],
      "Delete all Technology Services enquiries?",
      "All Technology Services enquiries were removed."
    );
    window.deleteReferralData = () => clearWithConfirmation(
      allDataSpecs.filter(spec => spec.path.startsWith("referral")),
      "Delete all referral data?",
      "All referral codes, joins, events and shares were removed."
    );
    window.resetDashboard = openDialog;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})();
