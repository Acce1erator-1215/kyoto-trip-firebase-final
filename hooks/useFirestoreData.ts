
import { useState, useEffect, useRef } from 'react';
// Removed v9 modular imports
import { db } from '../firebase';
import { INITIAL_ITINERARY } from '../services/mockData';
import { ItineraryItem, Expense, ShoppingItem, Restaurant, SightseeingSpot } from '../types';

/**
 * 自訂 Hook: useFirestoreData
 * 
 * Code Review Notes:
 * 1. 職責分離 (Separation of Concerns): 此 Hook 專注於資料的「獲取」與「同步」，不處理 UI 邏輯。
 * 2. 實時性 (Real-time): 使用 onSnapshot 而非 get()，確保多個使用者(或多裝置)間的資料即時同步。
 * 3. 初始種子資料 (Seeding): 包含自動檢測空資料庫並寫入 mockData 的邏輯。
 */
export const useFirestoreData = () => {
  // State 定義：分別儲存不同集合的資料
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [sightseeingSpots, setSightseeingSpots] = useState<SightseeingSpot[]>([]);
  
  // 錯誤狀態：用於 UI 顯示全螢幕錯誤 (如 API Key 失效或權限不足)
  const [dbError, setDbError] = useState(false);

  // Ref: seedAttempted
  // 用途：防止 React 18 Strict Mode 在開發環境下 Component Mount 兩次導致的重複寫入問題。
  // 雖然 Firestore 的 set() 是冪等的 (idempotent)，但重複執行寫入操作浪費資源。
  const seedAttempted = useRef(false);

  useEffect(() => {
    // 通用錯誤處理器：攔截權限不足 (Permission Denied) 錯誤
    // 這在 Firebase Rules 設定不正確時非常有用
    const handleSnapshotError = (err: any) => {
        console.error("Firebase Snapshot Error:", err);
        if (err.code === 'permission-denied') {
            setDbError(true);
        }
    };

    // 1. 監聽 'itinerary' (行程) 集合
    const unsubItinerary = db.collection('itinerary').onSnapshot(async (snapshot) => {
      // 初始化邏輯 (Data Seeding)
      // 當集合為空時，自動寫入預設資料，方便開發與測試
      if (snapshot.empty && !seedAttempted.current) {
         seedAttempted.current = true;
         console.log("偵測到行程為空，開始寫入預設種子資料...");
         
         // Performance: 使用 Batch (批次寫入)
         // 如果用 loop 呼叫 .set()，會產生 N 次網路請求。
         // 使用 batch 只有 1 次請求，且具備原子性 (Atomic) - 要嘛全成功，要嘛全失敗。
         const batch = db.batch(); 
         INITIAL_ITINERARY.forEach(item => {
            const ref = db.collection('itinerary').doc(item.id);
            batch.set(ref, item);
         });
         
         try {
            await batch.commit();
            console.log("預設資料寫入成功。");
         } catch (e) {
            console.error("寫入種子資料失敗:", e);
         }
      } else {
         // Data Mapping: 將 Firestore Document (Snapshot) 轉換為 App 的 TypeScript 介面
         const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItineraryItem));
         setItineraryItems(items);
         setDbError(false); // 若成功讀取則清除錯誤狀態
      }
    }, handleSnapshotError);

    // 2. 監聽 'expenses' (支出) 集合
    const unsubExpenses = db.collection('expenses').onSnapshot((snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(items);
    }, handleSnapshotError);

    // 3. 監聽 'shopping' (購物清單) 集合
    const unsubShopping = db.collection('shopping').onSnapshot((snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShoppingItem));
      setShoppingItems(items);
    }, handleSnapshotError);

    // 4. 監聽 'restaurants' (餐廳) 集合
    const unsubRestaurants = db.collection('restaurants').onSnapshot((snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
      setRestaurants(items);
    }, handleSnapshotError);

    // 5. 監聽 'sightseeing' (景點) 集合
    const unsubSightseeing = db.collection('sightseeing').onSnapshot((snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SightseeingSpot));
      setSightseeingSpots(items);
    }, handleSnapshotError);

    // Cleanup Function
    // 當組件卸載 (Unmount) 時，必須取消所有監聽器
    // 否則會造成 Memory Leak，且在背景持續消耗流量/讀取次數
    return () => {
      unsubItinerary();
      unsubExpenses();
      unsubShopping();
      unsubRestaurants();
      unsubSightseeing();
    };
  }, []);

  return {
    itineraryItems,
    expenses,
    shoppingItems,
    restaurants,
    sightseeingSpots,
    dbError
  };
};
