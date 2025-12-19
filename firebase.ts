
/**
 * Firebase 設定檔
 * 負責初始化 Firebase App, Firestore 資料庫
 * 
 * 修正：
 * 為了在瀏覽器環境 (No-Bundler/Vite Dev) 中穩定使用 Firebase v8 Compat 語法，
 * 我們改用 HTML 中的 <script> 標籤載入 UMD 版本，並直接存取全域變數 window.firebase。
 * 這避免了 importmap 與 esm.sh 在處理 compat 模式時的副作用問題。
 */

// 宣告全域變數型別，避免 TS 報錯
declare global {
  interface Window {
    firebase: any;
  }
}

// 取得全域 firebase 物件
const firebase = window.firebase;

if (!firebase) {
  console.error("Firebase SDK 未正確載入！請檢查 index.html 的 script 標籤。");
}

const apiKey = import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyD8LzBcWYzkYUw8y1A-UNReh75hGpvTXJk";

if (!apiKey) {
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

// 初始化 Firebase 應用實例 (防止重複初始化)
if (firebase && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// 初始化 Firestore
let db: any;
if (firebase) {
    db = firebase.firestore();
    
    // 攔截並過濾 Firestore 的棄用警告
    // 說明：Firebase SDK (v10.8.0 Compat) 在使用 enablePersistence 時會發出 
    // "enableMultiTabIndexedDbPersistence() will be deprecated" 的警告。
    // 由於 Compat UMD 版本尚未完全暴露 persistentLocalCache 等新 API，
    // 我們繼續使用 enablePersistence 但暫時過濾掉該警告以保持控制台整潔。
    const originalWarn = console.warn;
    console.warn = (...args) => {
        const msg = args[0];
        if (msg && typeof msg === 'string' && 
           (msg.includes('enableMultiTabIndexedDbPersistence') || msg.includes('FirestoreSettings.cache'))) {
            return;
        }
        originalWarn.apply(console, args);
    };
    
    db.enablePersistence({ synchronizeTabs: true }).catch((err: any) => {
        if (err.code == 'failed-precondition') {
            console.warn("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
        } else if (err.code == 'unimplemented') {
            console.warn("The current browser does not support all of the features required to enable persistence");
        }
    });
}

/**
 * 資料清理輔助函式
 * 用途：在寫入 Firestore 前移除物件中的 `undefined` 屬性
 * Firestore 不支援直接儲存 undefined
 */
export const sanitizeData = (data: any): any => {
  return JSON.parse(JSON.stringify(data));
};

export { db };
export default firebase;