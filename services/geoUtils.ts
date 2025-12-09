

/**
 * 計算兩個座標點之間的直線距離 (單位：公尺)
 * 使用 Haversine formula (半正矢公式)，適用於地球球面距離計算
 * 
 * @param lat1 起點緯度
 * @param lon1 起點經度
 * @param lat2 終點緯度
 * @param lon2 終點經度
 * @returns 距離 (公尺)
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // 地球平均半徑 (公尺)
    const φ1 = lat1 * Math.PI/180; // 角度轉弧度
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
  
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
    return R * c; 
  };
  
  /**
   * 將距離數值格式化為易讀字串
   * 小於 1000m 顯示 "XXm"，大於等於 1000m 顯示 "X.Xkm"
   */
  export const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };
  
  /**
   * 從 Google Maps URL 解析經緯度座標
   * 支援多種 URL 格式：
   * 1. 包含 !3d... !4d... (最精確，通常是分享地點時的格式)
   * 2. 包含 @lat,lng (通常是視口中心)
   * 3. 包含 q=lat,lng (搜尋參數)
   */
  export const parseCoordinatesFromUrl = (url: string): { lat: number, lng: number } | null => {
    try {
      if (!url) return null;
      
      // 優先級 1: 資料參數 !3d 和 !4d (這是分享特定地點時最準確的座標)
      // 範例: ...!3d34.9997865!4d135.7601172...
      const dataLatMatch = url.match(/!3d(-?\d+(\.\d+)?)/);
      const dataLngMatch = url.match(/!4d(-?\d+(\.\d+)?)/);

      if (dataLatMatch && dataLngMatch) {
        return {
          lat: parseFloat(dataLatMatch[1]),
          lng: parseFloat(dataLngMatch[1])
        };
      }

      // 優先級 2: 視口參數 @lat,lng
      // 注意：這通常是螢幕中心點，不一定是圖釘位置，但在沒有 !3d 參數時可用作備案
      const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match = url.match(regex);
      
      if (match && match.length >= 3) {
        return {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2])
        };
      }
      
      // 優先級 3: 查詢參數 q=lat,lng (舊版搜尋連結)
      const qRegex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
      const qMatch = url.match(qRegex);
      if (qMatch && qMatch.length >= 3) {
        return {
          lat: parseFloat(qMatch[1]),
          lng: parseFloat(qMatch[2])
        };
      }
  
      return null;
    } catch (e) {
      // console.warn removed
      return null;
    }
  };

  /**
   * 使用 OpenStreetMap (Nominatim API) 依名稱搜尋地點座標
   * 用途：當使用者只輸入地點名稱但沒有提供 Maps URL 時，自動補全座標
   * 
   * @param query 地點名稱關鍵字
   */
  export const searchLocationByName = async (query: string): Promise<{ lat: number, lng: number } | null> => {
      if (!query) return null;
      try {
          // 優化搜尋：若關鍵字未包含日本/京都，自動加上後綴以提高準確度
          const searchQuery = query.includes('日本') || query.includes('Japan') || query.includes('Kyoto') || query.includes('京都') || query.includes('大阪')|| query.includes('神戶')
              ? query 
              : `${query} Kyoto Japan`;
          
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
          const res = await fetch(url);
          const data = await res.json();
          
          if (data && data.length > 0) {
              return {
                  lat: parseFloat(data[0].lat),
                  lng: parseFloat(data[0].lon)
              };
          }
          return null;
      } catch (error) {
          // console.error removed
          return null;
      }
  };