
import { ItineraryItem, Expense, ShoppingItem, Restaurant, SightseeingSpot } from '../types';

export const INITIAL_ITINERARY: ItineraryItem[] = [
  // Day 0: Todo
  { id: 'todo-1', day: 0, time: '', location: 'VJW (Visit Japan Web)', category: 'other', notes: '入境手續登錄', completed: false },
  { id: 'todo-2', day: 0, time: '', location: '役男出境申請', category: 'other', notes: '內政部役政署', completed: false },
  { id: 'todo-3', day: 0, time: '', location: '大園停車場申請', category: 'transport', notes: '機場接送/停車', completed: false },
  { id: 'todo-4', day: 0, time: '', location: '買ESIM', category: 'shopping', notes: '網卡', completed: false },
  { id: 'todo-5', day: 0, time: '', location: '買旅平險', category: 'other', notes: '保險', completed: false },
  { id: 'todo-6', day: 0, time: '', location: '星宇餐點預訂', category: 'flight', notes: '預選餐點', completed: false },

  // Day 1: 1/17 (Sat) Kobe
  { id: 'd1-1', day: 1, time: '14:00', location: '神戶三宮東急REI', category: 'other', notes: 'Check-in / 住宿', completed: false },
  { id: 'd1-2', day: 1, time: '15:00', location: '神戶市區', category: 'sightseeing', notes: '市區周圍逛街', completed: false },
  { id: 'd1-3', day: 1, time: '18:00', location: '蟹道樂', category: 'food', notes: '晚餐', completed: false },
  { id: 'd1-4', day: 1, time: '20:00', location: '神戶六甲牧場霜淇淋', category: 'food', notes: '點心', completed: false },

  // Day 2: 1/18 (Sun) Himeji
  { id: 'd2-1', day: 2, time: '09:00', location: '前往姬路市', category: 'transport', notes: '移動', completed: false },
  { id: 'd2-2', day: 2, time: '10:30', location: '姬路城', category: 'sightseeing', notes: '世界遺產', completed: false },
  { id: 'd2-3', day: 2, time: '12:30', location: '神戶牛鐵板燒', category: 'food', notes: '午餐', completed: false },
  { id: 'd2-4', day: 2, time: '18:00', location: '神戶三宮東急REI', category: 'other', notes: '住宿', completed: false },

  // Day 3: 1/19 (Mon) Kobe -> Kyoto
  { id: 'd3-1', day: 3, time: '10:00', location: '移動: 神戶 => 京都', category: 'transport', notes: '', completed: false },
  { id: 'd3-2', day: 3, time: '11:30', location: 'Mimaru 京都四條', category: 'other', notes: '住宿 Check-in / 寄放行李', completed: false },
  { id: 'd3-3', day: 3, time: '13:00', location: '京都御苑', category: 'sightseeing', notes: '', completed: false },
  { id: 'd3-4', day: 3, time: '15:00', location: '錦市場', category: 'sightseeing', notes: '', completed: false },
  { id: 'd3-5', day: 3, time: '16:30', location: '市區逛街', category: 'shopping', notes: '', completed: false },
  { id: 'd3-6', day: 3, time: '18:30', location: '壽喜燒', category: 'food', notes: '晚餐', completed: false },

  // Day 4: 1/20 (Tue) Kyoto
  { id: 'd4-1', day: 4, time: '09:00', location: '清水寺', category: 'sightseeing', notes: '', completed: false },
  { id: 'd4-2', day: 4, time: '12:00', location: 'Shake Shack(漢堡)', category: 'food', notes: '午餐', completed: false },
  { id: 'd4-3', day: 4, time: '15:00', location: 'Okaffe Kyoto', category: 'food', notes: '咖啡', completed: false },
  { id: 'd4-4', day: 4, time: '18:00', location: 'Mimaru 京都四條', category: 'other', notes: '住宿', completed: false },

  // Day 5: 1/21 (Wed) Kyoto
  { id: 'd5-1', day: 5, time: '09:30', location: '嵐山', category: 'sightseeing', notes: '', completed: false },
  { id: 'd5-2', day: 5, time: '11:00', location: '渡月橋', category: 'sightseeing', notes: '', completed: false },
  { id: 'd5-3', day: 5, time: '18:00', location: 'Mimaru 京都四條', category: 'other', notes: '住宿', completed: false },

  // Day 6: 1/22 (Thu) Osaka
  { id: 'd6-1', day: 6, time: '09:00', location: '移動: 京都 => 大阪', category: 'transport', notes: '', completed: false },
  { id: 'd6-2', day: 6, time: '10:30', location: 'Parfait & Gelato LARGO', category: 'food', notes: '甜點', completed: false },
  { id: 'd6-3', day: 6, time: '12:00', location: '大阪車站', category: 'shopping', notes: '', completed: false },
  { id: 'd6-4', day: 6, time: '15:00', location: '心齋橋', category: 'shopping', notes: '', completed: false },
  { id: 'd6-5', day: 6, time: '17:00', location: '道頓堀', category: 'sightseeing', notes: '', completed: false },
  { id: 'd6-6', day: 6, time: '19:00', location: '大阪燒', category: 'food', notes: '晚餐', completed: false },
  { id: 'd6-7', day: 6, time: '21:00', location: 'Mimaru 京都四條', category: 'other', notes: '住宿 (回京都)', completed: false },

  // Day 7: 1/23 (Fri) Kyoto
  { id: 'd7-1', day: 7, time: '10:00', location: '三十三間堂', category: 'sightseeing', notes: '古蹟', completed: false },
  { id: 'd7-2', day: 7, time: '13:00', location: '自由活動', category: 'other', notes: '', completed: false },
  { id: 'd7-3', day: 7, time: '18:00', location: 'Mimaru 京都四條', category: 'other', notes: '住宿', completed: false },

  // Day 8: 1/24 (Sat) Departure
  { id: 'd8-1', day: 8, time: '10:00', location: '移動: 京都 => 大阪', category: 'transport', notes: '移動至機場', completed: false },
  { id: 'd8-2', day: 8, time: '14:00', location: 'KIX 關西機場', category: 'flight', notes: '出發返程', completed: false },
  { id: 'd8-3', day: 8, time: '15:00', location: '星宇餐點', category: 'food', notes: '機上餐', completed: false },
];

export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_SHOPPING: ShoppingItem[] = [];
export const INITIAL_RESTAURANTS: Restaurant[] = [];
export const INITIAL_SIGHTSEEING: SightseeingSpot[] = [];
