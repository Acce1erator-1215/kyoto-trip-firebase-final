
import React, { useEffect, useRef } from 'react';
import { ItineraryItem, Restaurant, SightseeingSpot, Category } from '../types';

// 宣告全域的 L (Leaflet)，因為是透過 index.html 的 script 標籤引入的 (無須 npm install)
declare const L: any;

interface Props {
  items: (ItineraryItem | Restaurant | SightseeingSpot)[]; // 要顯示的地點列表
  userLocation: { lat: number, lng: number } | null;       // 使用者當前位置
  focusedLocation?: { lat: number, lng: number } | null;   // 指定要聚焦的座標
}

// 輔助函式：HTML 轉義，防止 XSS
const escapeHtml = (unsafe: string) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 };

/**
 * 地圖組件 (Map Component)
 * 使用 Leaflet.js 渲染 OpenStreetMap
 */
export const MapComponent: React.FC<Props> = ({ items, userLocation, focusedLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null); // 保存 Leaflet Map 實例
  const userMarkerRef = useRef<any>(null);  // 使用者位置的 Marker
  const itemMarkersRef = useRef<any[]>([]); // 地點 Markers 陣列
  const hasFittedBounds = useRef(false);    // 記錄是否已執行過自動縮放

  // 預設中心點: 京都車站
  const KYOTO_CENTER = { lat: 34.9858, lng: 135.7588 };

  // 取得標記顏色與圖示樣式
  const getItemStyle = (item: any): { color: string; typeLabel: string; icon: string } => {
    // 1. 判斷是否為餐廳 (有 rating 屬性且無 category 屬性)
    if (item.rating !== undefined && !item.category) {
        return { color: '#D97706', typeLabel: '美食', icon: '🍴' }; // Amber-600
    }
    
    // 2. 判斷是否為景點清單項目 (無 category 且無 rating)
    if (!item.category && item.rating === undefined) {
        return { color: '#183654', typeLabel: '景點', icon: '⛩️' }; // Wafu-Indigo
    }

    // 3. 行程項目 (有 category)
    switch (item.category as Category) {
        case 'food':
            return { color: '#D97706', typeLabel: '美食', icon: '🍜' }; // Amber-600
        case 'shopping':
            return { color: '#2563EB', typeLabel: '購物', icon: '🛍️' }; // Blue-600
        case 'transport':
            return { color: '#475569', typeLabel: '交通', icon: '🚅' }; // Slate-600
        case 'flight':
            return { color: '#0284C7', typeLabel: '航班', icon: '✈️' }; // Sky-600
        case 'other':
            return { color: '#57534E', typeLabel: '其他', icon: '🔖' }; // Stone-600
        case 'sightseeing':
        default:
            return { color: '#183654', typeLabel: '景點', icon: '⛩️' }; // Wafu-Indigo
    }
  };

  // 初始化地圖 (僅執行一次)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // 避免重複初始化

    try {
        const map = L.map(mapContainerRef.current, {
            center: [KYOTO_CENTER.lat, KYOTO_CENTER.lng],
            zoom: 13,
            zoomControl: false, // 隱藏預設縮放控制項 (另外手動添加以調整位置)
            attributionControl: false,
            dragging: true
        });

        // 使用 CartoDB 的 Light 風格圖層 (免費且美觀，適合簡約設計)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?v=2', {
            maxZoom: 19,
            subdomains: 'abcd',
        }).addTo(map);

        // 將縮放控制項移至右下角，避免遮擋頂部 Header
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstanceRef.current = map;
    } catch (e) {
        console.error("Leaflet init error:", e);
    }

    // 清理函式：組件卸載時銷毀地圖實例
    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  // 修復地圖渲染問題：
  // 當 Tab 切換或地圖顯示時，容器可能正在進行動畫 (fade-in/slide)，導致地圖大小計算錯誤 (灰色區塊)。
  // 使用 setTimeout 延遲呼叫 invalidateSize() 以確保容器大小已穩定。
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200); // 200ms 延遲，配合 CSS transition 時間
        return () => clearTimeout(timer);
    }
  }, []); // Add empty dependency array to run only on mount

  // 當 items 更新時，重新繪製地點標記 (Markers)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 清除舊標記
    itemMarkersRef.current.forEach(m => m.remove());
    itemMarkersRef.current = [];

    // 計算邊界以自動縮放 (Fit Bounds)
    const bounds = L.latLngBounds([]);

    // 過濾出有效的地點 (必須有座標和 Google Maps 連結)
    const validItems = items.filter(item => item.lat && item.lng && item.mapsUrl);

    validItems.forEach((item, index) => {
        const lat = item.lat!;
        const lng = item.lng!;
        
        // 判斷標題 (Itinerary 用 location, 其他用 name)
        const rawTitle = (item as any).location || (item as any).name || '地點';
        const title = escapeHtml(rawTitle); // XSS 防護
        
        // 取得該類別的顏色與圖示
        const style = getItemStyle(item);
        const typeLabel = escapeHtml(style.typeLabel); // XSS 防護
        
        // 判斷顯示內容：
        // 如果是行程項目 (有 day 屬性)，顯示「數字序號」以便對照時間順序
        // 如果是口袋名單 (餐廳/景點)，顯示「圖示」以便直觀識別類別
        const isItinerary = (item as any).day !== undefined;
        const content = isItinerary ? (index + 1).toString() : style.icon;
        const fontSize = isItinerary ? '12px' : '14px';

        // 自訂標記樣式 (水滴狀 + 內容)
        // 使用 L.divIcon 允許我們用 HTML/CSS 自定義 Marker 外觀
        const markerIcon = L.divIcon({
            className: 'custom-map-marker',
            html: `
              <div style="
                background-color: ${style.color}; 
                color: white; 
                width: 28px; 
                height: 28px; 
                border-radius: 50% 50% 50% 0; 
                transform: rotate(-45deg); 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
                border: 2px solid white;
                position: relative;
              ">
                <span style="transform: rotate(45deg); font-weight: bold; font-family: 'Shippori Mincho'; font-size: ${fontSize}; line-height: 1;">${content}</span>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 28], // 錨點設為水滴尖端
            popupAnchor: [0, -28]
        });

        const marker = L.marker([lat, lng], { icon: markerIcon })
            .addTo(map)
            .bindPopup(`
                <div style="font-family: 'Noto Sans JP'; min-width: 150px;">
                    <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                        <span style="background-color: ${style.color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold;">${typeLabel}</span>
                    </div>
                    <div style="font-weight: bold; color: #183654; margin-bottom: 4px; font-size: 14px;">${title}</div>
                    ${item.mapsUrl ? `<a href="${item.mapsUrl}" target="_blank" style="display: inline-block; background: #183654; color: white; text-decoration: none; padding: 4px 8px; border-radius: 4px; font-size: 10px;">Google Maps</a>` : ''}
                </div>
            `);
        
        itemMarkersRef.current.push(marker);
        bounds.extend([lat, lng]);
    });

    if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
    }

    // 自動縮放邏輯：僅在尚未手動聚焦且尚未執行過自動縮放時觸發
    if (!focusedLocation && !hasFittedBounds.current) {
        if (itemMarkersRef.current.length > 0 || userLocation) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            hasFittedBounds.current = true;
        }
    }

  }, [items, userLocation]);

  // 處理聚焦特效 (當使用者點擊列表中的地點時)
  useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map || !focusedLocation) return;

      map.flyTo([focusedLocation.lat, focusedLocation.lng], 16, {
          animate: true,
          duration: 1.5 // 平滑飛行時間
      });

  }, [focusedLocation]);

  // 更新使用者位置標記 (藍點 + 脈衝動畫)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    
    const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
            <div style="
                width: 16px; 
                height: 16px; 
                background-color: #3B82F6; 
                border: 3px solid white; 
                border-radius: 50%; 
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                position: relative;
            ">
               <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: rgba(59, 130, 246, 0.2); border-radius: 50%; animation: pulse 2s infinite;"></div>
            </div>
            <style>
               @keyframes pulse {
                   0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
                   100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
               }
            </style>
        `,
        iconSize: [16, 16],
    });

    if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
    }
  }, [userLocation]);

  // 阻止事件冒泡：防止在地圖上操作時觸發父層的拖曳捲動
  const stopPropagation = (e: React.SyntheticEvent | React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0 relative"
        style={{background: '#f5f5f5'}} 
        // 攔截滑鼠和觸控事件
        onMouseDown={stopPropagation}
        onTouchStart={stopPropagation}
      />
    </>
  );
};
