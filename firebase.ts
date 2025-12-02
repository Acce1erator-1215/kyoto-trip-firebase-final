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
// FIX FOR ERRORS: Set this to true ONLY after you have registered your domains 
// (localhost, vercel.app, firebaseapp.com) in the Google reCAPTCHA Admin Console.
const ENABLE_APP_CHECK = false; 

if (typeof window !== 'undefined' && ENABLE_APP_CHECK) {
  const allowedDomains = [
    "kyoyo-trip-store.firebaseapp.com",
    "kyoyo-trip-store.web.app"
  ];
  
  // Check if current hostname is allowed
  const isAllowed = allowedDomains.includes(location.hostname);

  if (isAllowed) {
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
    console.debug(`App Check skipped for hostname: ${location.hostname}`);
  }
}

export const db = getFirestore(app);