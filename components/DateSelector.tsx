
import React from 'react';
import { DATES } from '../types';
import { useDraggableScroll } from '../hooks/useDraggableScroll';

const getDayKanji = (index: number) => {
  const kanjiDays = ['準備', '初日', '二日', '三日', '四日', '五日', '六日', '七日', '八日'];
  return kanjiDays[index] || `Day ${index}`;
};

interface DateSelectorProps {
  selectedDay: number;
  setSelectedDay: (d: number) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDay, setSelectedDay }) => {
  const scrollLogic = useDraggableScroll({ direction: 'horizontal' });
  
  return (
    <div className="sticky top-0 z-20 bg-wafu-bg/90 backdrop-blur-xl border-b border-wafu-indigo/5 pb-3 pt-2 px-0 shadow-glass transition-all">
      <div 
        ref={scrollLogic.ref}
        {...scrollLogic.events}
        className={`flex overflow-x-auto gap-3.5 px-6 pb-1 md:justify-center max-w-7xl mx-auto ${scrollLogic.className}`}
      >
        {/* 準備按鈕 */}
        <button
          type="button"
          onClick={() => scrollLogic.onEntryClick(() => setSelectedDay(0))}
          className={`shrink-0 flex items-center justify-center px-5 h-[48px] rounded-xl border transition-all duration-300 active-bounce relative overflow-hidden group
            ${selectedDay === 0 
              ? 'bg-wafu-indigo text-white border-wafu-indigo shadow-luxury ring-1 ring-wafu-indigo/20' 
              : 'bg-white text-stone-400 border-stone-100 hover:border-wafu-indigo/20 shadow-sm'}`}
        >
           {/* 全局和紙紋理疊加 */}
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-wafu-paper"></div>
           
           <span className={`text-xs font-serif font-bold whitespace-nowrap tracking-[0.2em] transition-colors ${selectedDay === 0 ? 'text-white' : 'text-stone-400'}`}>
             準備
           </span>
           
           {selectedDay === 0 && (
             <>
               <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-leaf"></div>
               <div className="absolute inset-0 bg-gradient-to-tr from-wafu-darkIndigo/20 to-transparent pointer-events-none"></div>
             </>
           )}
        </button>
        
        {DATES.map((date, idx) => {
          const dayNum = idx + 1;
          const dayLabel = getDayKanji(dayNum);
          const dateParts = date.slice(5).split('-'); // [01, 17]
          const isSelected = selectedDay === dayNum;
          
          return (
            <button
              key={date}
              type="button"
              onClick={() => scrollLogic.onEntryClick(() => setSelectedDay(dayNum))}
              className={`shrink-0 flex items-center justify-center px-4 h-[48px] rounded-xl border transition-all duration-500 active-bounce relative overflow-hidden
                ${isSelected 
                  ? 'bg-wafu-indigo text-white border-wafu-indigo shadow-luxury ring-1 ring-wafu-indigo/30' 
                  : 'bg-white text-stone-500 border-stone-100 hover:border-wafu-indigo/10 shadow-sm'}`}
            >
              {/* 背景層次 */}
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-wafu-paper"></div>
              
              {isSelected && (
                <>
                  {/* 選中時的漸層與紋理 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-wafu-indigo via-wafu-indigo to-wafu-darkIndigo opacity-100"></div>
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/washi.png')] mix-blend-overlay"></div>
                  
                  {/* 金箔護角細節 - 使用流動動畫 */}
                  <div 
                    className="absolute top-0 right-0 w-5 h-5 shadow-sm z-10 animate-gold-shimmer" 
                    style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
                  ></div>
                  
                  {/* 底部裝飾線 */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-wafu-gold/40"></div>
                </>
              )}

              <div className="relative z-20 flex flex-col items-center leading-none gap-1.5">
                 <span className={`text-[13px] font-serif font-bold tracking-[0.15em] transition-colors ${isSelected ? 'text-wafu-goldLight' : 'text-wafu-indigo'}`}>
                   {dayLabel}
                 </span>
                 <div className={`text-[9px] tracking-widest font-mono flex gap-0.5 font-medium ${isSelected ? 'text-white/60' : 'text-stone-300'}`}>
                   <span>{dateParts[0]}</span>
                   <span className="opacity-40">/</span>
                   <span>{dateParts[1]}</span>
                 </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  );
};
