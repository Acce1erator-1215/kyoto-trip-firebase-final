
import React from 'react';
import { ItineraryItem, CATEGORIES, Category } from '../../types';
import { Icons } from '../Icon';
import { calculateDistance, formatDistance } from '../../services/geoUtils';

interface Props {
  item: ItineraryItem;
  isTodo: boolean;
  userLocation?: { lat: number, lng: number } | null;
  onFocus?: (lat: number, lng: number) => void;
  onEdit: (item: ItineraryItem, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onToggleComplete: (id: string, currentStatus: boolean) => void;
}

// 使用 React.memo 包覆組件，避免因父組件渲染而導致不必要的重繪
export const ItineraryItemCard = React.memo(({
  item,
  isTodo,
  userLocation,
  onFocus,
  onEdit,
  onDelete,
  onToggleComplete
}: Props) => {
  const distanceStr = (userLocation && item.lat && item.lng && item.mapsUrl) 
    ? formatDistance(calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng))
    : null;
  const hasMap = !!(item.lat && item.lng && item.mapsUrl);

  return (
    <div
      onClick={() => hasMap && onFocus && onFocus(item.lat!, item.lng!)}
      className={`
        relative group flex items-start gap-3 sm:gap-4 z-10 transition-all duration-300 animate-zoom-in
        ${isTodo && item.completed ? 'opacity-60 grayscale' : ''}
        ${hasMap ? 'cursor-pointer hover:scale-[1.01]' : ''}
      `}
    >
      {!isTodo && (
        <div className="w-14 shrink-0 flex flex-col items-end pt-5 relative">
          <span className="font-serif font-bold text-wafu-indigo text-base tracking-tighter">{item.time}</span>
          <div className="w-3 h-3 rounded-full border-2 border-wafu-bg bg-wafu-indigo absolute right-[-1.15rem] top-[1.65rem] z-20 shadow-sm"></div>
        </div>
      )}

      {isTodo && (
        <div className="w-10 shrink-0 flex items-center justify-center pt-5">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleComplete(item.id, !!item.completed); }}
            className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-200 active-bounce
              ${item.completed 
                ? 'bg-wafu-gold text-white shadow-sm animate-pop' 
                : 'border-2 border-stone-300 bg-white hover:border-wafu-gold'
              }
            `}>
              {item.completed && <Icons.Check />}
            </button>
        </div>
      )}

      <div className={`
          flex-1 bg-white rounded-2xl p-5 shadow-washi border border-stone-100 relative overflow-hidden group-hover:shadow-float transition-all active:scale-[0.99]
          ${isTodo && item.completed ? 'border-l-4 border-l-wafu-gold' : ''}
          ${isTodo && !item.completed ? 'border-l-4 border-l-stone-200' : ''}
        `}>
          <div className="absolute inset-0 bg-wafu-paper opacity-80 pointer-events-none"></div>
          {isTodo && item.completed && (
              <div className="absolute top-2 right-2 z-30 animate-stamp-drop pointer-events-none opacity-80">
                  <Icons.Goshuin className="w-24 h-24 text-red-700/80 mix-blend-multiply transform rotate-12" />
              </div>
          )}

          {item.imageUrl && (
              <div className="mb-3 rounded-xl overflow-hidden h-32 w-full relative z-10 border border-stone-100">
                  <img src={item.imageUrl} alt={item.location} className="w-full h-full object-cover" />
              </div>
          )}

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-2 items-center">
                <span className={`text-[10px] px-2 py-0.5 border font-bold tracking-widest uppercase font-serif rounded-md ${CATEGORIES[item.category].color}`}>
                  {CATEGORIES[item.category].label}
                </span>
                {distanceStr && (
                    <span className="text-[10px] bg-wafu-indigo/10 text-wafu-indigo px-1.5 py-0.5 rounded font-bold font-mono">
                      {distanceStr}
                    </span>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-start gap-2">
              <h3 className={`font-serif text-lg font-bold text-wafu-text leading-snug tracking-wide ${isTodo && item.completed ? 'line-through decoration-stone-400 opacity-60' : ''}`}>
                {item.location}
              </h3>
              <div className="flex gap-1">
                  {item.mapsUrl && (
                  <a href={item.mapsUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-wafu-indigo hover:text-wafu-gold transition-colors p-1 active-bounce">
                      <Icons.MapLink />
                  </a>
                  )}
                  <button onClick={(e) => onEdit(item, e)} className="p-1 text-stone-400 hover:text-wafu-indigo transition-all duration-100 active-bounce">
                      <Icons.Edit />
                  </button>
                  <button onClick={(e) => onDelete(item.id, e)} className="p-1 text-stone-400 hover:text-stone-600 transition-all duration-100 active-bounce">
                      <Icons.Trash />
                  </button>
              </div>
            </div>
            {item.notes && <div className="mt-3 pt-2 border-t border-dashed border-stone-200 text-sm text-stone-500 font-sans leading-relaxed">{item.notes}</div>}
          </div>
      </div>
    </div>
  );
});
