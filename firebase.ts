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
// Only initialize in production/deployed environment to avoid "ReCAPTCHA error" on localhost
// because localhost is not whitelisted in the reCAPTCHA console.
if (typeof window !== 'undefined') {
  const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  
  if (!isLocalhost) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6LfbRx8sAAAAAGMry9PFCHoF29WgEwKOqhdjgYyU'),
      isTokenAutoRefreshEnabled: true
    });
  } else {
    // Optional: Log to confirm it's skipped
    console.debug("App Check skipped on localhost to avoid ReCAPTCHA errors.");
  }
}

export const db = getFirestore(app);