
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
    <div className="sticky top-0 z-20 bg-wafu-bg/85 backdrop-blur-xl border-b border-white/20 pb-2 pt-2 px-0 shadow-glass transition-all">
      <div 
        ref={scrollLogic.ref}
        {...scrollLogic.events}
        // md:justify-center: 在平板/電腦上置中顯示，更美觀
        // max-w-7xl mx-auto: 限制最大寬度
        className={`flex overflow-x-auto gap-3 px-5 pb-1 md:justify-center max-w-7xl mx-auto ${scrollLogic.className}`}
      >
        <button
          type="button"
          onClick={() => scrollLogic.onEntryClick(() => setSelectedDay(0))}
          className={`shrink-0 flex items-center justify-center gap-2 px-4 h-[44px] rounded-xl border transition-all duration-300 active-bounce relative overflow-hidden group
            ${selectedDay === 0 
              ? 'bg-wafu-indigo text-white border-wafu-indigo shadow-lg gold-glow ring-1 ring-wafu-indigo/50' 
              : 'bg-white/80 text-stone-400 border-transparent hover:border-wafu-indigo/20 hover:bg-white shadow-sm'}`}
        >
           <span className="text-xs font-serif font-bold whitespace-nowrap tracking-widest">準備</span>
           {selectedDay === 0 && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-leaf"></div>}
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
              className={`shrink-0 flex items-center justify-center gap-2 px-3 h-[44px] rounded-xl border transition-all duration-300 active-bounce relative overflow-hidden
                ${isSelected 
                  ? 'bg-wafu-indigo text-white border-wafu-indigo shadow-lg gold-glow ring-1 ring-wafu-indigo/50' 
                  : 'bg-white/80 text-stone-500 border-transparent hover:border-wafu-indigo/20 hover:bg-white shadow-sm'}`}
            >
              {isSelected && (
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/washi.png')] mix-blend-overlay"></div>
              )}
              {isSelected && <div className="absolute top-0 right-0 w-4 h-4 bg-gold-leaf opacity-100" style={{clipPath: 'polygon(100% 0, 0 0, 100% 100%)'}}></div>}

              <div className="flex flex-col items-start leading-none gap-1">
                 <span className={`text-xs font-serif font-bold tracking-widest ${isSelected ? 'text-white' : 'text-wafu-indigo'}`}>{dayLabel}</span>
                 <div className={`text-[9px] tracking-tighter font-mono flex gap-0.5 ${isSelected ? 'text-white/70' : 'text-stone-300'}`}>
                   <span>{dateParts[0]}</span><span className="opacity-50">/</span><span>{dateParts[1]}</span>
                 </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  );
};
