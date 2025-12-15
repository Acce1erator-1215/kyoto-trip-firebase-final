
import React from 'react';
import { ShoppingItem } from '../../types';
import { Icons } from '../Icon';

interface Props {
  item: ShoppingItem;
  exchangeRate: number;
  onEdit: (item: ShoppingItem) => void;
  onDelete: (id: string, item: ShoppingItem, e: React.MouseEvent) => void;
  onToggleBought: (id: string, item: ShoppingItem) => void;
  onUpdateQuantity: (id: string, delta: number, item: ShoppingItem) => void;
}

/**
 * 伴手禮卡片 (ShoppingItemCard)
 * 
 * 互動設計：
 * 1. 購買狀態 (Bought)：點擊右上角打勾，卡片會變灰並加入蓋章動畫。
 *    同時會觸發 onToggleBought，在父組件中連動產生支出紀錄。
 * 2. 數量增減：直接在卡片上操作，即時更新總金額。
 */
export const ShoppingItemCard: React.FC<Props> = ({ 
  item, 
  exchangeRate, 
  onEdit, 
  onDelete, 
  onToggleBought, 
  onUpdateQuantity 
}) => {
  const qty = item.quantity || 1;
  const totalPriceYen = (item.priceYen || 0) * qty;
  const totalPriceTwd = Math.round(totalPriceYen * exchangeRate);

  return (
    <div className="bg-white rounded-2xl shadow-washi border border-stone-100 overflow-hidden group flex flex-col relative transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] animate-zoom-in">
        {/* 背景紋理 */}
        <div className="absolute inset-0 bg-wafu-paper opacity-50 pointer-events-none z-10 mix-blend-multiply"></div>

        {/* 圖片區域 (點擊可編輯) */}
        <div className="h-28 bg-stone-100 relative overflow-hidden cursor-pointer" onClick={() => onEdit(item)}>
            <img src={item.imageUrl} alt={item.name} className={`w-full h-full object-cover transition-all duration-500 ${item.bought ? 'grayscale opacity-50' : 'group-hover:scale-110'}`} />
            
            {/* 購買狀態切換按鈕 (右上角) */}
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleBought(item.id, item); }}
                className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-20 ${item.bought ? 'animate-pop' : ''}
                ${item.bought ? 'bg-wafu-gold text-white' : 'bg-white text-stone-300'}`}
            >
                <Icons.Check />
            </button>
            
            {/* 口味標籤 */}
            {item.flavor && (
                <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold z-20 shadow-sm
                    ${item.flavor === 'sweet' ? 'bg-pink-100/90 text-pink-700' : 'bg-orange-100/90 text-orange-700'}
                `}>
                    {item.flavor === 'sweet' ? '甜' : '鹹'}
                </div>
            )}
        </div>

        {/* 內容區域 */}
        <div className="p-3 flex-1 flex flex-col justify-between relative z-20">
            <div>
                <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-serif font-bold text-sm leading-tight line-clamp-2 ${item.bought ? 'text-stone-400 line-through' : 'text-wafu-text'}`}>
                        {item.name}
                    </h3>
                    <button 
                        onClick={(e) => onDelete(item.id, item, e)} 
                        className="text-stone-200 hover:text-stone-400 -mr-1 -mt-1 p-1"
                    >
                        <Icons.Trash />
                    </button>
                </div>
                <p className="text-[10px] text-stone-400 line-clamp-1">{item.description}</p>
            </div>
            
            <div className="mt-3 flex items-end justify-between">
                <div className="flex flex-col">
                    <div className="text-[10px] text-stone-400 font-mono">¥{item.priceYen?.toLocaleString()} 円</div>
                    <div className="text-sm font-bold text-wafu-indigo font-mono">
                        NT$ {totalPriceTwd.toLocaleString()}
                    </div>
                </div>
                
                {/* 數量控制器 */}
                <div className="flex items-center bg-stone-50 rounded-lg border border-stone-100 h-6">
                        <button 
                        onClick={() => onUpdateQuantity(item.id, -1, item)}
                        className="px-1.5 h-full flex items-center justify-center text-stone-400 hover:text-wafu-indigo active:bg-stone-200"
                        >
                        -
                        </button>
                        <span className="text-xs font-bold text-wafu-indigo px-1">{qty}</span>
                        <button 
                        onClick={() => onUpdateQuantity(item.id, 1, item)}
                        className="px-1.5 h-full flex items-center justify-center text-stone-400 hover:text-wafu-indigo active:bg-stone-200"
                        >
                        +
                        </button>
                </div>
            </div>
        </div>
    </div>
  );
};
