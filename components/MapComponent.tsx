
import React, { useEffect, useRef } from 'react';
import { ItineraryItem, Restaurant, SightseeingSpot, Category } from '../types';

// 宣告全域的 L (Leaflet)，因為是透過 index.html 的 script 標籤引入的 (無須 npm install)
declare const L: any;

interface Props {
  items: (ItineraryItem | Restaurant | SightseeingSpot)[]; // 要顯示的地點列表
  userLocation: { lat: number, lng: number } | null;       // 使用者當前位置
  focusedLocation?: { lat: number, lng: number } | null;   // 指定要聚焦的座標
}

// Security: XSS 防護
// 雖然我們相信自己的資料庫，但在渲染 HTML 字串到 Leaflet Popup 時，
// 進行轉義 (Escaping) 是防禦性程式設計 (Defensive Programming) 的好習慣。
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
 * 
 * Code Review Notes:
 * 1. 第三方庫整合: 整合非 React 原生庫 (如 Leaflet, D3, jQuery) 時，
 *    通常需要使用 useRef 來獲取真實 DOM 節點，並在 useEffect 中管理其生命週期。
 * 2. 避免重複初始化: 必須檢查 mapInstanceRef.current 是否存在。
 */
export const MapComponent: React.FC<Props> = ({ items, userLocation, focusedLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null); // 保存 Leaflet Map 實例 (Mutable Ref)
  const userMarkerRef = useRef<any>(null);  // 使用者位置的 Marker
  const itemMarkersRef = useRef<any[]>([]); // 地點 Markers 陣列，用於清除舊標記
  const hasFittedBounds = useRef(false);    // UX: 記錄是否已執行過自動縮放，避免每次移動都重置視角

  // 預設中心點: 京都車站
  const KYOTO_CENTER = { lat: 34.9858, lng: 135.7588 };

  // Helper: 根據類別決定標記顏色 (集中管理樣式邏輯)
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

  // Effect 1: 初始化地圖 (Mount Only)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Critical: 避免 React Strict Mode 導致重複初始化

    try {
        const map = L.map(mapContainerRef.current, {
            center: [KYOTO_CENTER.lat, KYOTO_CENTER.lng],
            zoom: 13,
            zoomControl: false, // UI: 隱藏預設縮放，以便自定義位置
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

    // Cleanup: 組件卸載時銷毀地圖，防止記憶體洩漏與 DOM 殘留
    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  // Effect 2: 解決 Resize/Render 問題 (Hack)
  // 問題: 當地圖容器原本是 hidden (display:none) 後來變為 visible，
  // Leaflet 無法正確讀取容器大小，導致地圖變成灰色一塊。
  // 解法: 使用 invalidateSize() 強制重繪。
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200); // 200ms 延遲，配合 CSS transition 動畫時間
        return () => clearTimeout(timer);
    }
  }, []); 

  // Effect 3: 渲染地點標記 (當 items 更新時)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 清除舊標記 (Performance: 避免標記無限疊加)
    itemMarkersRef.current.forEach(m => m.remove());
    itemMarkersRef.current = [];

    // 用於計算邊界以自動縮放
    const bounds = L.latLngBounds([]);

    // Filter Logic: 只顯示有效座標與有效連結的項目
    const validItems = items.filter(item => item.lat && item.lng && item.mapsUrl);

    validItems.forEach((item, index) => {
        const lat = item.lat!;
        const lng = item.lng!;
        
        const rawTitle = (item as any).location || (item as any).name || '地點';
        const title = escapeHtml(rawTitle); // XSS
        
        const style = getItemStyle(item);
        const typeLabel = escapeHtml(style.typeLabel); 
        
        // UI Logic: 行程顯示數字，其餘顯示 Icon
        const isItinerary = (item as any).day !== undefined;
        const content = isItinerary ? (index + 1).toString() : style.icon;
        const fontSize = isItinerary ? '12px' : '14px';

        // Advanced Leaflet: 使用 L.divIcon 進行完全自定義的 Marker 樣式
        // 這比替換 iconUrl 更有彈性，可以使用 CSS3 變形與陰影
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
            iconAnchor: [14, 28], // 錨點設為水滴尖端 (重要：否則縮放時位置會跑掉)
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

    // UX Logic: 自動縮放 (Auto-Fit)
    // 規則：只在「尚未手動聚焦」且「地圖剛載入」時執行一次，避免干擾使用者操作
    if (!focusedLocation && !hasFittedBounds.current) {
        if (itemMarkersRef.current.length > 0 || userLocation) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            hasFittedBounds.current = true;
        }
    }

  }, [items, userLocation]);

  // Effect 4: 處理外部聚焦請求 (FlyTo)
  useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map || !focusedLocation) return;

      map.flyTo([focusedLocation.lat, focusedLocation.lng], 16, {
          animate: true,
          duration: 1.5 // Smooth animation duration
      });

  }, [focusedLocation]);

  // Effect 5: 使用者位置標記 (帶動畫)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    
    // CSS3 Animation implementation inside SVG/HTML
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

  // Event Handling: 阻止事件冒泡 (Stop Propagation)
  // 重要：因為外層有 useDraggableScroll，如果不在這裡阻止冒泡，
  // 拖曳地圖時會同時觸發頁面捲動，導致體驗極差。
  const stopPropagation = (e: React.SyntheticEvent | React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0 relative"
        style={{background: '#f5f5f5'}} 
        // Bind stop propagation handlers
        onMouseDown={stopPropagation}
        onTouchStart={stopPropagation}
      />
    </>
  );
};
