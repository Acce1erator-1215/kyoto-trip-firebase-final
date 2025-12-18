
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { BottomNavigation, Tab } from './BottomNavigation';
import { SakuraOverlay } from './SakuraOverlay';
import { Header } from './Header';

// Context
import { ToastProvider, useToast } from '../context/ToastContext';

// Tabs (Modular Components with RWD built-in)
import { ItineraryTab } from './tabs/ItineraryTab';
import { SightseeingTab } from './tabs/SightseeingTab';
import { FoodTab } from './tabs/FoodTab';
import { ExpenseTab } from './tabs/ExpenseTab';
import { ShoppingTab } from './tabs/ShoppingTab';
import { FlightTab } from './tabs/FlightTab';

// Hooks
import { useDraggableScroll } from '../hooks/useDraggableScroll';
import { useGeolocation } from '../hooks/useGeolocation';
import { useExchangeRate } from '../hooks/useExchangeRate';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { useSakuraAnimation } from '../hooks/useSakuraAnimation';

/**
 * App Root Component
 */
export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

function AppContent() {
  const { showToast } = useToast();

  // --- UI State Management ---
  const [activeTab, setActiveTab] = useState<Tab>('itinerary'); 
  const [showMap, setShowMap] = useState<boolean>(true); 
  const [focusedLocation, setFocusedLocation] = useState<{lat: number, lng: number} | null>(null); 
  
  // --- Scroll Memory Logic ---
  const tabScrollPositions = useRef<Record<string, number>>({});
  const mainContentDrag = useDraggableScroll({ direction: 'vertical' });

  const handleTabChange = (newTab: Tab) => {
    if (activeTab === newTab) return;
    if (mainContentDrag.ref.current) {
      tabScrollPositions.current[activeTab] = mainContentDrag.ref.current.scrollTop;
    }
    setActiveTab(newTab);
  };

  useLayoutEffect(() => {
    if (mainContentDrag.ref.current) {
      const savedPosition = tabScrollPositions.current[activeTab] || 0;
      mainContentDrag.ref.current.scrollTop = savedPosition;
    }
  }, [activeTab]);

  // --- Custom Hooks ---
  const { userLocation, error: geoError } = useGeolocation(); 
  const { currentRate, refresh: refreshRate, isLoading: isRateLoading, lastUpdated: rateLastUpdated } = useExchangeRate(); 
  const { isSpinning, sakuraPetals, triggerSakura } = useSakuraAnimation(); 
  
  const { 
    itineraryItems, 
    expenses, 
    shoppingItems, 
    restaurants, 
    sightseeingSpots, 
    dbError 
  } = useFirestoreData(); 

  // --- Handlers ---
  const handleFocus = (lat: number, lng: number) => {
      if (!showMap) setShowMap(true);
      setFocusedLocation({ lat, lng });
      if (mainContentDrag.ref.current) {
          mainContentDrag.ref.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const handleCenterOnUser = () => {
    if (userLocation) {
      if (!showMap) setShowMap(true);
      setFocusedLocation({ ...userLocation }); 
      if (mainContentDrag.ref.current) {
        mainContentDrag.ref.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      showToast("已移動至您的位置", "info");
    } else if (geoError) {
      showToast(`定位無法使用: ${geoError}，請檢查瀏覽器權限`, "error");
    } else {
      showToast("正在獲取位置資訊...請稍候", "info");
    }
  };

  return (
    /* 使用 fixed inset-0 確保主體完全覆蓋螢幕，防止背景色溢出 */
    <div className="fixed inset-0 bg-wafu-paper flex flex-col overflow-hidden font-sans text-base">
      
      {dbError && (
        <div className="fixed inset-0 z-[20000] bg-black/80 flex flex-col items-center justify-center text-white p-8 text-center backdrop-blur-md">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">資料庫存取被拒</h2>
            <button onClick={() => window.location.reload()} className="bg-white text-black px-6 py-2 rounded-full font-bold active:scale-95 transition-transform">重新整理</button>
        </div>
      )}

      <SakuraOverlay petals={sakuraPetals} />

      <Header triggerSakura={triggerSakura} isSpinning={isSpinning} />

      {/* Main Content Area - pb-20 預留給導航列 */}
      <div 
        ref={mainContentDrag.ref} 
        {...mainContentDrag.events} 
        className={`flex-1 overflow-y-auto relative z-10 bg-wafu-paper overscroll-y-contain pb-20 ${mainContentDrag.className.replace('select-none', '')}`}
      >
        <div key={activeTab} className="animate-fade-in-up-gentle min-h-full flex flex-col">
          
          {activeTab === 'itinerary' && (
            <ItineraryTab 
              items={itineraryItems}
              userLocation={userLocation}
              showMap={showMap}
              setShowMap={setShowMap}
              focusedLocation={focusedLocation}
              onFocus={handleFocus}
              onCenterUser={handleCenterOnUser}
              geoError={geoError}
            />
          )}

          {activeTab === 'sightseeing' && (
            <SightseeingTab 
              items={sightseeingSpots}
              userLocation={userLocation}
              showMap={showMap}
              setShowMap={setShowMap}
              focusedLocation={focusedLocation}
              onFocus={handleFocus}
              onCenterUser={handleCenterOnUser}
              geoError={geoError}
            />
          )}

          {activeTab === 'food' && (
            <FoodTab 
              items={restaurants}
              userLocation={userLocation}
              showMap={showMap}
              setShowMap={setShowMap}
              focusedLocation={focusedLocation}
              onFocus={handleFocus}
              onCenterUser={handleCenterOnUser}
              geoError={geoError}
            />
          )}

          {activeTab === 'money' && (
            <ExpenseTab 
              expenses={expenses}
              currentRate={currentRate}
              refreshRate={refreshRate}
              isRateLoading={isRateLoading}
              rateLastUpdated={rateLastUpdated}
            />
          )}

          {activeTab === 'shop' && (
            <ShoppingTab 
              items={shoppingItems}
              expenses={expenses}
              currentRate={currentRate}
            />
          )}
          
          {activeTab === 'flight' && (
            <FlightTab />
          )}
        </div>
      </div>

      <BottomNavigation 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        shoppingCount={shoppingItems.filter(i => !i.bought && !i.deleted).length} 
      />
    </div>
  );
}
