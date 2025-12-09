
import React from 'react';
import { Expense } from '../../types';
import { Icons } from '../Icon';

interface Props {
  item: Expense;
  exchangeRate: number;
  onEdit: (item: Expense) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onQuantityUpdate: (id: string, delta: number, expense: Expense) => void;
}

export const ExpenseItemCard: React.FC<Props> = ({ item, exchangeRate, onEdit, onDelete, onQuantityUpdate }) => {
  return (
    <div onClick={() => onEdit(item)} className="flex flex-col gap-2 bg-white p-4 rounded-2xl shadow-sm border border-stone-100 transition-transform active:scale-[0.98] group hover:border-wafu-indigo/30 relative overflow-hidden animate-zoom-in cursor-pointer">
        <div className="absolute inset-0 bg-wafu-paper opacity-30 pointer-events-none"></div>
        
        <div className="relative z-10 flex justify-between items-start">
            <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-full border border-stone-200 text-xl flex items-center justify-center text-wafu-indigo font-serif bg-stone-50 shrink-0">
                    ¥
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-stone-700 font-serif text-lg truncate pr-2">{item.title}</div>
                    <div className="text-xs text-stone-400 mt-0.5 font-mono">{item.date}</div>
                </div>
            </div>
            
            <div className="text-right shrink-0">
                <div className="font-mono font-bold text-wafu-indigo text-lg">¥{item.amountYen.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                <div className="text-xs text-stone-400 mt-0.5 font-medium">≈ NT${Math.round(item.amountYen * exchangeRate).toLocaleString()}</div>
            </div>
        </div>

        <div className="relative z-10 flex justify-between items-center mt-2 border-t border-stone-100 pt-2">
            <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-lg border border-stone-100" onClick={e => e.stopPropagation()}>
                <button onClick={() => onQuantityUpdate(item.id, -1, item)} className="text-stone-400 hover:text-wafu-indigo active-bounce w-8 h-8 flex items-center justify-center font-bold text-lg bg-white rounded-md shadow-sm border border-stone-100">-</button>
                <span className="text-sm font-bold text-wafu-indigo font-mono w-8 text-center">{item.quantity || 1}</span>
                <button onClick={() => onQuantityUpdate(item.id, 1, item)} className="text-stone-400 hover:text-wafu-indigo active-bounce w-8 h-8 flex items-center justify-center font-bold text-lg bg-white rounded-md shadow-sm border border-stone-100">+</button>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={(e) => onDelete(item.id, e)}
                    className="text-stone-300 hover:text-red-400 active-bounce p-2"
                >
                    <Icons.Trash />
                </button>
            </div>
        </div>
        
        {item.notes && (
            <div className="relative z-10 text-xs text-stone-500 bg-stone-50 p-2 rounded-lg mt-1">
                {item.notes}
            </div>
        )}
    </div>
  );
};
