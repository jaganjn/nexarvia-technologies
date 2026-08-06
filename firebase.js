const firebaseConfig = {
  apiKey: "AIzaSyAJ6712p0MdiL2JKuh3GxuPuGSuRVp3ILI",
  authDomain: "mnc-internship-live.firebaseapp.com",
  databaseURL: "https://mnc-internship-live-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mnc-internship-live",
  storageBucket: "mnc-internship-live.firebasestorage.app",
  messagingSenderId: "190638783121",
  appId: "1:190638783121:web:492d77b4233cc23b8a5d30"
};

let db = null;
let auth = null;

if (typeof firebase === "undefined") {
  console.error("Firebase SDK is unavailable. Check the network connection or script loading policy.");
} else {
  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    if (typeof firebase.database === "function") db = firebase.database();
    if (typeof firebase.auth === "function") auth = firebase.auth();
  } catch (error) {
    console.error("Firebase initialisation failed:", error);
  }
}
