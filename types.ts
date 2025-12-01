
export type Category = 'sightseeing' | 'transport' | 'flight' | 'food' | 'shopping' | 'other';

export interface ItineraryItem {
  id: string;
  day: number; // 0 = Todo, 1-8 = Days
  time: string;
  location: string;
  category: Category;
  notes: string;
  completed?: boolean;
  imageUrl?: string; 
  mapsUrl?: string;
  deleted?: boolean; // Soft delete
}

export interface Expense {
  id: string;
  title: string;
  amountYen: number;
  category: string;
  payer: string;
  date: string;
  quantity?: number;
  deleted?: boolean; // Soft delete
}

export interface ShoppingItem {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  priceYen?: number;
  bought: boolean;
  quantity?: number;
  linkedExpenseId?: string;
  deleted?: boolean; // Soft delete
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  rating: number; // 1-5
  imageUrl?: string;
  mapsUrl?: string;
  deleted?: boolean; // Soft delete
}

export interface SightseeingSpot {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  mapsUrl?: string;
  deleted?: boolean; // Soft delete
}

// Updated colors to Blue/Gold/Neutral theme - Strictly Enforced
export const CATEGORIES: { [key in Category]: { label: string; icon: string; color: string } } = {
  sightseeing: { label: '景點', icon: '⛩️', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  transport: { label: '交通', icon: '🚅', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  flight: { label: '航班', icon: '✈️', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  food: { label: '美食', icon: '🍜', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  shopping: { label: '購物', icon: '🛍️', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  other: { label: '其他', icon: '🔖', color: 'bg-stone-100 text-stone-600 border-stone-200' },
};

export const DATES = [
  "2026-01-17",
  "2026-01-18",
  "2026-01-19",
  "2026-01-20",
  "2026-01-21",
  "2026-01-22",
  "2026-01-23",
  "2026-01-24",
];
