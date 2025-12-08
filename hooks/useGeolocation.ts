
import { useState, useEffect } from 'react';

/**
 * 自訂 Hook: useGeolocation
 * 用途：獲取並實時追蹤使用者的 GPS 位置
 * 原理：使用瀏覽器原生的 navigator.geolocation API
 */
export const useGeolocation = () => {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    // 若瀏覽器不支援地理定位，則直接結束
    if (!navigator.geolocation) return;

    // 成功回呼：更新位置狀態
    const success = (pos: GeolocationPosition) => {
        setUserLocation({ 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude 
        });
    };
    
    // 錯誤回呼
    const error = (err: any) => console.warn("地理定位被拒絕或發生錯誤:", err);
    
    // 使用 watchPosition 進行實時追蹤 (當位置改變時自動更新)
    // enableHighAccuracy: true 表示要求高精確度 (通常會開啟 GPS，較耗電)
    const watchId = navigator.geolocation.watchPosition(success, error, {
        enableHighAccuracy: true,
        timeout: 20000, // 逾時時間
        maximumAge: 1000 // 快取時間
    });

    // 清理函式：取消位置追蹤
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { userLocation };
};
