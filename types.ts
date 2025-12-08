
// 行程類別定義：景點、交通、航班、美食、購物、其他
export type Category = 'sightseeing' | 'transport' | 'flight' | 'food' | 'shopping' | 'other';

/**
 * 行程項目 (Itinerary Item) 的資料結構
 * 對應 Firestore 'itinerary' 集合
 */
export interface ItineraryItem {
  id: string;          // 唯一識別碼 (通常是 Timestamp)
  day: number;         // 第幾天 (0 = 行前準備 Todo, 1-8 = 實際旅遊天數)
  time: string;        // 時間字串 (例如 "09:00")，用於排序
  location: string;    // 地點名稱或待辦事項標題
  category: Category;  // 類別，決定 icon 與顏色
  notes: string;       // 詳細備註
  completed?: boolean; // 是否完成 (主要用於 Day 0 的 Checkbox)
  imageUrl?: string;   // 圖片 URL (Base64 或 外部連結)
  mapsUrl?: string;    // Google Maps 連結
  lat?: number;        // 緯度 (用於地圖標記)
  lng?: number;        // 經度 (用於地圖標記)
  deleted?: boolean;   // 軟刪除標記 (Soft delete)，true 代表在回收桶
}

/**
 * 支出紀錄 (Expense) 的資料結構
 * 對應 Firestore 'expenses' 集合
 */
export interface Expense {
  id: string;
  title: string;       // 消費項目名稱
  amountYen: number;   // 日幣金額
  category: string;    // 類別 (shopping, food, other...)
  payer: string;       // 付款人 (目前固定為 Me)
  date: string;        // 日期 (YYYY-MM-DD)
  quantity?: number;   // 數量 (預設 1)
  notes?: string;      // 備註
  deleted?: boolean;   // 軟刪除標記
}

/**
 * 伴手禮/購物清單 (Shopping Item) 的資料結構
 * 對應 Firestore 'shopping' 集合
 */
export interface ShoppingItem {
  id: string;
  name: string;        // 商品名稱
  description: string; // 描述或代購備註
  imageUrl?: string;   // 商品參考圖
  priceYen?: number;   // 預估或實際單價 (日幣)
  bought: boolean;     // 是否已購買
  quantity?: number;   // 購買數量
  linkedExpenseId?: string; // 關聯的支出 ID (當勾選「已購買」時自動產生支出，取消時自動刪除)
  flavor?: 'sweet' | 'salty'; // 口味標籤：甜食或鹹食 (用於篩選)
  deleted?: boolean;   // 軟刪除標記
}

/**
 * 餐廳口袋名單 (Restaurant) 的資料結構
 * 對應 Firestore 'restaurants' 集合
 */
export interface Restaurant {
  id: string;
  name: string;
  description: string; // 評價或筆記
  rating: number;      // 評分 1.0 - 5.0
  imageUrl?: string;
  mapsUrl?: string;
  lat?: number;
  lng?: number;
  tags?: string[];     // 標籤 (例如：拉麵, 甜點, 壽司...)
  deleted?: boolean;
}

/**
 * 景點口袋名單 (Sightseeing Spot) 的資料結構
 * 對應 Firestore 'sightseeing' 集合
 */
export interface SightseeingSpot {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  mapsUrl?: string;
  lat?: number;
  lng?: number;
  deleted?: boolean;
}

// 類別常數定義：包含 UI 顯示名稱、Emoji 圖示和 Tailwind CSS 顏色樣式
// 設計風格：採用和風/低飽和度色彩
export const CATEGORIES: { [key in Category]: { label: string; icon: string; color: string } } = {
  sightseeing: { label: '景點', icon: '⛩️', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  transport: { label: '交通', icon: '🚅', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  flight: { label: '航班', icon: '✈️', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  food: { label: '美食', icon: '🍜', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  shopping: { label: '購物', icon: '🛍️', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  other: { label: '其他', icon: '🔖', color: 'bg-stone-100 text-stone-600 border-stone-200' },
};

// 行程日期陣列 (Day 1 到 Day 8)
// 用於日期選擇器與行程過濾
export const DATES = [
  "2026-01-17", // Day 1
  "2026-01-18", // Day 2
  "2026-01-19", // Day 3
  "2026-01-20", // Day 4
  "2026-01-21", // Day 5
  "2026-01-22", // Day 6
  "2026-01-23", // Day 7
  "2026-01-24", // Day 8
];
