import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8LzBcWYzkYUw8y1A-UNReh75hGpvTXJk",
  authDomain: "kyoyo-trip-store.firebaseapp.com",
  projectId: "kyoyo-trip-store",
  storageBucket: "kyoyo-trip-store.firebasestorage.app",
  messagingSenderId: "109524758898",
  appId: "1:109524758898:web:bf4cd966d31458b4d6edeb",
  measurementId: "G-W57REEZNFX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check with reCAPTCHA v3
if (typeof window !== 'undefined') {
  // STRICT ALLOWLIST: Only initialize App Check on domains explicitly registered 
  // in the Google reCAPTCHA Admin Console.
  // This prevents "ReCAPTCHA error" on localhost, Vercel previews, or other dev environments.
  const allowedDomains = [
    "kyoyo-trip-store.firebaseapp.com",
    "kyoyo-trip-store.web.app"
  ];
  
  if (allowedDomains.includes(location.hostname)) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6LfbRx8sAAAAAGMry9PFCHoF29WgEwKOqhdjgYyU'),
        isTokenAutoRefreshEnabled: true
      });
      console.debug("App Check initialized.");
    } catch (e) {
      console.warn("App Check initialization failed:", e);
    }
  } else {
    // Silently skip on other domains (localhost, previews, etc.)
    console.debug(`App Check skipped for hostname: ${location.hostname}`);
  }
}

export const db = getFirestore(app);