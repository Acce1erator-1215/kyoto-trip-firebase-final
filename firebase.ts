
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

/**
 * Firebase 設定檔
 * 負責初始化 Firebase App, Firestore 資料庫以及 App Check 安全驗證
 */

// 安全性修正：
// 1. 使用 Optional Chaining (?.) 防止 import.meta.env 為 undefined 時程式崩潰
// 2. 加入後備 Key (Fallback)，確保在環境變數失效時應用程式仍可運作
const apiKey = import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyD8LzBcWYzkYUw8y1A-UNReh75hGpvTXJk";

if (!apiKey) {
  // 理論上因為有後備 Key，這行不應該被執行，但保留作為最後防線
  console.warn("⚠️ 警告: 使用預設 API Key 或無法讀取環境變數。");
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "kyoyo-trip-store.firebaseapp.com",
  projectId: "kyoyo-trip-store",
  storageBucket: "kyoyo-trip-store.firebasestorage.app",
  messagingSenderId: "109524758898",
  appId: "1:109524758898:web:bf4cd966d31458b4d6edeb",
  measurementId: "G-W57REEZNFX"
};

// 初始化 Firebase 應用實例
const app = initializeApp(firebaseConfig);

// 初始化 Firestore 並啟用「離線持久化緩存」
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// 初始化 App Check
const ENABLE_APP_CHECK = false; 

if (typeof window !== 'undefined' && ENABLE_APP_CHECK) {
  const allowedDomains = [
    "kyoyo-trip-store.firebaseapp.com",
    "kyoyo-trip-store.web.app",
    "localhost" 
  ];
  
  const isAllowed = allowedDomains.includes(location.hostname);

  if (isAllowed) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6LfbRx8sAAAAAGMry9PFCHoF29WgEwKOqhdjgYyU'),
        isTokenAutoRefreshEnabled: true
      });
      console.debug("App Check 已初始化保護中。");
    } catch (e) {
      console.warn("App Check 初始化失敗:", e);
    }
  }
}

/**
 * 資料清理輔助函式
 * 用途：在寫入 Firestore 前移除物件中的 `undefined` 屬性
 */
export const sanitizeData = (data: any): any => {
  return JSON.parse(JSON.stringify(data));
};

export { db };
