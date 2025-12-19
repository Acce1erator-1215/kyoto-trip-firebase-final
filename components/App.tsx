import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { BottomNavigation } from './BottomNavigation';
import { SakuraOverlay } from './SakuraOverlay';
import { Header } from './Header';

// Context Providers
import { ToastProvider } from '../context/ToastContext';
import { LocationProvider } from '../context/LocationContext';
import { UIProvider, useUI } from '../context/UIContext';
import { DataProvider, useData } from '../context/DataContext';

// Tabs
import { ItineraryTab } from './tabs/ItineraryTab';
import { SightseeingTab } from './tabs/SightseeingTab';
import { FoodTab } from './tabs/FoodTab';
import { ExpenseTab } from './tabs/ExpenseTab';
import { ShoppingTab } from './tabs/ShoppingTab';
import { FlightTab } from './tabs/FlightTab';

// Hooks
import { useDraggableScroll } from '../hooks/useDraggableScroll';
import { useSakuraAnimation } from '../hooks/useSakuraAnimation';

/**
 * App Root Component
 * Wraps the application in necessary Context Providers
 */
export default function App() {
  return (
    <ToastProvider>
      <LocationProvider>
        <UIProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </UIProvider>
      </LocationProvider>
    </ToastProvider>
  );
}

function AppContent() {
  const { dbError } = useData();
  const { activeTab, focusedLocation } = useUI();
  const { isSpinning, sakuraPetals, triggerSakura } = useSakuraAnimation();

  // --- Scroll Logic ---
  const tabScrollPositions = useRef<Record<string, number>>({});
  const mainContentDrag = useDraggableScroll({ direction: 'vertical' });

  // Handle scroll memory when switching tabs
  useLayoutEffect(() => {
    if (mainContentDrag.ref.current) {
      const savedPosition = tabScrollPositions.current[activeTab] || 0;
      mainContentDrag.ref.current.scrollTop = savedPosition;
    }
  }, [activeTab]);

  // Save scroll position before tab change
  const prevTabRef = useRef(activeTab);
  useLayoutEffect(() => {
    if (prevTabRef.current !== activeTab && mainContentDrag.ref.current) {
       tabScrollPositions.current[prevTabRef.current] = mainContentDrag.ref.current.scrollTop;
    }
    prevTabRef.current = activeTab;
  }, [activeTab]);


  // Scroll to top when focusedLocation changes (triggered by map clicks)
  useEffect(() => {
    if (focusedLocation && mainContentDrag.ref.current) {
      mainContentDrag.ref.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [focusedLocation]);
  
  // --- Mobile Height Fix (Enhanced Polling) ---
  useEffect(() => {
    const setAppHeight = () => {
      const doc = document.documentElement;
      // 使用 window.innerHeight 確保包含 iOS Safari 的動態網址列變化
      const height = window.innerHeight;
      if (height > 0) {
        doc.style.setProperty('--app-height', `${height}px`);
      }
    };

    // 1. 初始化執行
    setAppHeight();

    // 2. 監聽 resize / orientationchange
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);

    // 3. [關鍵修正] 輪詢機制 (Polling)
    // 瀏覽器 UI 在載入初期會動態伸縮，導致前幾毫秒的高度是錯的。
    // 我們在 100ms, 300ms, 500ms, 1000ms 各校正一次，確保抓到穩定後的數值。
    const timers = [100, 300, 500, 1000, 1500].map(delay => 
      setTimeout(setAppHeight, delay)
    );

    return () => {
      window.removeEventListener('resize', setAppHeight);
      window.removeEventListener('orientationchange', setAppHeight);
      timers.forEach(t => clearTimeout(t));
    };
  }, []);


  return (
    // Update: style 使用 var(--app-height) 配合 fallback 100%
    // 這裡改回 fixed inset-0 搭配 JS 高度，這是 PWA 類應用最穩定的容器設法
    <div 
      className="fixed inset-0 w-full bg-wafu-paper flex flex-col overflow-hidden font-sans text-base"
      style={{ height: 'var(--app-height, 100%)' }}
    >
      
      {/* Critical DB Error Overlay */}
      {dbError && (
        <div className="fixed inset-0 z-[20000] bg-black/80 flex flex-col items-center justify-center text-white p-8 text-center backdrop-blur-md">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">資料庫存取被拒</h2>
            <button onClick={() => window.location.reload()} className="bg-white text-black px-6 py-2 rounded-full font-bold active:scale-95 transition-transform">重新整理</button>
        </div>
      )}

      <SakuraOverlay petals={sakuraPetals} />

      <Header triggerSakura={triggerSakura} isSpinning={isSpinning} />

      {/* Main Content Area */}
      {/* pb-28 預留底部導航空間 */}
      <div 
        ref={mainContentDrag.ref} 
        {...mainContentDrag.events} 
        className={`flex-1 overflow-y-auto relative z-10 bg-wafu-paper overscroll-y-contain pb-28 ${mainContentDrag.className.replace('select-none', '')}`}
      >
        <div key={activeTab} className="animate-fade-in-up-gentle min-h-full flex flex-col">
          {activeTab === 'itinerary' && <ItineraryTab />}
          {activeTab === 'sightseeing' && <SightseeingTab />}
          {activeTab === 'food' && <FoodTab />}
          {activeTab === 'money' && <ExpenseTab />}
          {activeTab === 'shop' && <ShoppingTab />}
          {activeTab === 'flight' && <FlightTab />}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}