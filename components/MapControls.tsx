import React from 'react';
import { Icons } from './Icon';
import { useUI } from '../context/UIContext';
import { useLocation } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';

export const MapControls: React.FC = () => {
  const { showMap, setShowMap, setFocusedLocation } = useUI();
  const { userLocation, error: geoError } = useLocation();
  const { showToast } = useToast();

  const handleCenterUser = () => {
    if (userLocation) {
        if (!showMap) setShowMap(true);
        setFocusedLocation(userLocation);
        showToast("已移動至您的位置", "info");
    } else if (geoError) {
        showToast(`定位無法使用: ${geoError}`, "error");
    } else {
        showToast("正在獲取位置...請稍候", "info");
    }
  };

  return (
    <div className="flex justify-center py-2 bg-wafu-paper/50 backdrop-blur-sm border-b border-stone-100 z-10 relative gap-2">
      <button 
        onClick={() => setShowMap(!showMap)} 
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest shadow-sm transition-all active-bounce border ${showMap ? 'bg-wafu-indigo text-white border-wafu-indigo shadow-md' : 'bg-white text-stone-400 border-stone-200 hover:border-wafu-indigo/30'}`}
      >
        <Icons.MapPin className="w-3 h-3" strokeWidth={2.5} />
        <span>{showMap ? "隱藏地圖" : "顯示地圖"}</span>
      </button>

      {showMap && (
        <button 
          onClick={handleCenterUser} 
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest shadow-sm transition-all active-bounce border 
            ${userLocation 
              ? 'bg-white text-wafu-indigo border-wafu-indigo/30 hover:border-wafu-indigo hover:bg-wafu-indigo/5' 
              : geoError
                ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                : 'bg-stone-100 text-stone-400 border-stone-200'
            }`}
        >
            <Icons.Navigation className={`w-3 h-3 ${!userLocation && !geoError ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
            <span>
                {userLocation ? '定位' : (geoError ? geoError : '定位中')}
            </span>
        </button>
      )}
    </div>
  );
};
