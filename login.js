(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const form = $("adminLoginForm");
  const emailInput = $("username");
  const passwordInput = $("password");
  const errorBox = $("error");
  const loginButton = $("loginButton");
  const toggle = $("passwordToggle");
  const status = $("firebaseLoginStatus");
  let authReady = false;

  const setStatus = (message, state = "checking") => {
    if (!status) return;
    status.dataset.state = state;
    status.innerHTML = `<i></i> ${message}`;
  };
  const showMessage = (message = "", type = "error") => {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.dataset.type = type;
  };
  const setBusy = (busy) => {
    if (!loginButton) return;
    loginButton.disabled = busy || !authReady;
    loginButton.innerHTML = busy
      ? `<span class="login-spinner" aria-hidden="true"></span> Signing in…`
      : `Login to Dashboard <span>→</span>`;
  };
  const authAvailable = () => typeof auth !== "undefined" && auth && typeof auth.signInWithEmailAndPassword === "function";

  async function submitLogin(event) {
    event?.preventDefault();
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";
    if (!authReady || !authAvailable()) {
      showMessage("Firebase Authentication is not ready. Check your connection and retry.");
      return;
    }
    if (!email || !password) {
      showMessage("Enter the administrator email and password.");
      return;
    }
    setBusy(true); showMessage("");
    try {
      await auth.signInWithEmailAndPassword(email, password);
      setStatus("Access verified", "ready");
      window.location.replace("admin.html");
    } catch (error) {
      console.error("Firebase login failed:", error);
      const messages = {
        "auth/invalid-email": "Enter a valid administrator email address.",
        "auth/user-disabled": "This administrator account has been disabled.",
        "auth/user-not-found": "Administrator account not found.",
        "auth/wrong-password": "Incorrect email or password.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
        "auth/network-request-failed": "Network error. Check your connection and retry.",
        "auth/unauthorized-domain": "This deployed domain is not authorised in Firebase Authentication."
      };
      showMessage(messages[error?.code] || "Unable to sign in. Verify Firebase configuration and administrator credentials.");
      setBusy(false);
    }
  }

  form?.addEventListener("submit", submitLogin);
  toggle?.addEventListener("click", () => {
    if (!passwordInput) return;
    passwordInput.type = passwordInput.type === "password" ? "text" : "password";
    toggle.textContent = passwordInput.type === "password" ? "Show" : "Hide";
  });

  const initTimer = window.setTimeout(() => {
    if (authReady) return;
    setStatus("Authentication service unavailable", "error");
    showMessage("Firebase Authentication did not initialise. Check the deployed domain, API-key restrictions and internet connection.");
    setBusy(false);
  }, 8000);

  if (!authAvailable()) {
    window.clearTimeout(initTimer);
    setStatus("Authentication service unavailable", "error");
    showMessage("Firebase Authentication could not be loaded. Refresh the page or verify the Firebase scripts.");
    setBusy(false);
    return;
  }

  setStatus("Checking secure access…", "checking");
  auth.onAuthStateChanged((user) => {
    window.clearTimeout(initTimer);
    authReady = true;
    if (user) {
      try { localStorage.setItem("nexarviaAdminBrowserUntilV46", String(Date.now() + 30 * 60 * 1000)); } catch {}
      setStatus("Administrator session found", "ready");
      window.location.replace("admin.html");
      return;
    }
    setStatus("Firebase connected", "ready");
    setBusy(false);
  }, (error) => {
    window.clearTimeout(initTimer);
    console.error("Authentication state error:", error);
    authReady = false;
    setStatus("Authentication check failed", "error");
    showMessage("Unable to verify Firebase Authentication. Refresh and retry.");
    setBusy(false);
  });
})();
