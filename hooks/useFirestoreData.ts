
import { useState, useEffect, useRef } from 'react';
// Removed v9 modular imports
import { db } from '../firebase';
import { INITIAL_ITINERARY } from '../services/mockData';
import { ItineraryItem, Expense, ShoppingItem, Restaurant, SightseeingSpot } from '../types';

/**
 * 自訂 Hook: useFirestoreData
 * 責任：
 * 1. 實時監聽 (Real-time Listener) Firestore 中的五個主要集合
 * 2. 處理資料庫初始化 (Seeding)：若檢測到行程為空，自動寫入預設資料
 * 3. 統一管理資料載入狀態與權限錯誤
 */
export const useFirestoreData = () => {
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [sightseeingSpots, setSightseeingSpots] = useState<SightseeingSpot[]>([]);
  const [dbError, setDbError] = useState(false);

  // 使用 useRef 防止 React Strict Mode 下重複執行初始化寫入
  const seedAttempted = useRef(false);

  useEffect(() => {
    // 通用錯誤處理器：攔截權限不足 (Permission Denied) 錯誤
    const handleSnapshotError = (err: any) => {
        console.error("Firebase Snapshot Error:", err);
        if (err.code === 'permission-denied') {
            setDbError(true);
        }
    };

    // 1. 監聽 'itinerary' (行程) 集合
    const unsubItinerary = db.collection('itinerary').onSnapshot(async (snapshot) => {
      // 初始化邏輯：如果資料庫是空的且尚未嘗試初始化
      if (snapshot.empty && !seedAttempted.current) {
         seedAttempted.current = true;
         console.log("偵測到行程為空，開始寫入預設種子資料...");
         
         const batch = db.batch(); // 使用 Batch 批次寫入以提升效能
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
         // 將 Firestore 文件轉換為我們的 TypeScript 介面格式
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

    // 清理函式 (Cleanup)：組件卸載時取消所有監聽器，避免記憶體洩漏
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
