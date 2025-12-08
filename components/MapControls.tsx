
import React from 'react';
import { Icons } from './Icon';

interface MapControlsProps {
  showMap: boolean;
  setShowMap: (show: boolean) => void;
  userLocation: { lat: number, lng: number } | null;
  onCenterUser: () => void;
}

/**
 * 地圖控制列組件
 * 包含：顯示/隱藏地圖按鈕、定位使用者按鈕
 */
export const MapControls: React.FC<MapControlsProps> = ({ 
  showMap, 
  setShowMap, 
  userLocation, 
  onCenterUser 
}) => {
  return (
    <div className="flex justify-center py-2 bg-wafu-paper/50 backdrop-blur-sm border-b border-stone-100 z-10 relative gap-2">
      {/* 顯示/隱藏切換 */}
      <button 
        onClick={() => setShowMap(!showMap)} 
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest shadow-sm transition-all active-bounce border ${showMap ? 'bg-wafu-indigo text-white border-wafu-indigo shadow-md' : 'bg-white text-stone-400 border-stone-200 hover:border-wafu-indigo/30'}`}
      >
        <Icons.MapPin className="w-3 h-3" strokeWidth={2.5} />
        <span>{showMap ? "隱藏地圖" : "顯示地圖"}</span>
      </button>

      {/* 定位按鈕 (僅在有地圖且有定位權限時顯示) */}
      {showMap && userLocation && (
        <button 
          onClick={onCenterUser} 
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest shadow-sm transition-all active-bounce border bg-white text-wafu-indigo border-wafu-indigo/30 hover:border-wafu-indigo hover:bg-wafu-indigo/5"
        >
            <Icons.Navigation className="w-3 h-3" strokeWidth={2.5} />
            <span>定位</span>
        </button>
      )}
    </div>
  );
};
