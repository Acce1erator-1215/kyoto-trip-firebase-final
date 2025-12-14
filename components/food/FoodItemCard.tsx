
import React from 'react';
import { Restaurant } from '../../types';
import { Icons } from '../Icon';
import { calculateDistance, formatDistance } from '../../services/geoUtils';

interface Props {
  item: Restaurant;
  userLocation?: { lat: number, lng: number } | null;
  onFocus?: (lat: number, lng: number) => void;
  onEdit: (item: Restaurant, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const FoodItemCard: React.FC<Props> = ({ item, userLocation, onFocus, onEdit, onDelete }) => {
  const distanceStr = (userLocation && item.lat && item.lng && item.mapsUrl) 
    ? formatDistance(calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng))
    : null;
  
  const hasMap = item.lat && item.lng && item.mapsUrl;

  return (
    <div 
      onClick={() => hasMap && onFocus && onFocus(item.lat!, item.lng!)}
      className={`bg-white rounded-2xl shadow-washi border border-stone-100 overflow-hidden flex flex-col sm:flex-row group transition-all hover:shadow-luxury relative active:scale-[0.99] duration-200 animate-zoom-in ${hasMap ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
    >
      <div className="sm:w-32 h-40 sm:h-auto relative bg-stone-50">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-stone-300">
                <Icons.Utensils className="w-8 h-8 mb-1" strokeWidth={1.5} />
                <span className="text-[10px] font-bold">無照片</span>
            </div>
          )}
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur rounded px-2 py-0.5 text-xs font-bold text-wafu-gold shadow-sm flex items-center gap-1">
            <Icons.Star filled /> {item.rating.toFixed(1)}
          </div>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-serif font-bold text-wafu-indigo">{item.name}</h3>
                <div className="flex gap-2">
                    {item.mapsUrl && (
                        <a href={item.mapsUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-stone-400 hover:text-wafu-indigo transition-colors active-bounce p-1">
                            <Icons.MapLink />
                        </a>
                    )}
                    <button onClick={(e) => onEdit(item, e)} className="text-stone-400 hover:text-wafu-indigo active-bounce p-1">
                        <Icons.Edit />
                    </button>
                    <button onClick={(e) => onDelete(item.id, e)} className="text-stone-300 hover:text-stone-500 p-1 active-bounce">
                        <Icons.Trash />
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                {distanceStr && (
                    <span className="text-[9px] bg-wafu-indigo/10 text-wafu-indigo px-2 py-0.5 rounded font-bold font-mono">
                        📍 {distanceStr}
                    </span>
                )}
                {item.tags?.map(tag => (
                    <span key={tag} className="text-[9px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded font-bold">{tag}</span>
                ))}
            </div>
            <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed">{item.description}</p>
          </div>
      </div>
    </div>
  );
};
