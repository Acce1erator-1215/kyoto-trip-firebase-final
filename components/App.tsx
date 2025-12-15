
import React, { useState, useMemo } from 'react';
import { Itinerary } from './Itinerary';
import { ShoppingList } from './ShoppingList';
import { FoodList } from './FoodList'; 
import { SightseeingList } from './SightseeingList'; 
import { ExpenseTracker } from './ExpenseTracker';
import { FlightPass } from './FlightPass';
import { MapComponent } from './MapComponent';
import { DateSelector } from './DateSelector';
import { BottomNavigation, Tab } from './BottomNavigation';
import { SakuraOverlay } from './SakuraOverlay';
import { Header } from './Header';         
import { MapControls } from './MapControls'; 

// Hooks
import { useDraggableScroll } from '../hooks/useDraggableScroll';
import { useGeolocation } from '../hooks/useGeolocation';
import { useExchangeRate } from '../hooks/useExchangeRate';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { useSakuraAnimation } from '../hooks/useSakuraAnimation';

/**
 * App Root Component
 * 
 * 架構說明 (Architecture):
 * 這是一個單頁應用 (SPA)，採用 "Lifted State" 模式。
 * 所有的核心資料 (User Location, Firestore Data, UI State) 都在此層級管理，
 * 並透過 Props 向下傳遞。對於中小型應用，這比引入 Redux/Zustand 更輕量且直觀。
 */
export default function App() {
  // --- UI State Management ---
  const [activeTab, setActiveTab] = useState<Tab>('itinerary'); 
  const [selectedDay, setSelectedDay] = useState<number>(1); 
  const [showMap, setShowMap] = useState<boolean>(true); 
  // 用於控制地圖聚焦的狀態，當使用者點擊列表項目時觸發
  const [focusedLocation, setFocusedLocation] = useState<{lat: number, lng: number} | null>(null); 
  
  // --- Custom Hooks (Logic Separation) ---
  // 將複雜的邏輯抽離至 hooks 目錄，保持 App.tsx 乾淨
  const { userLocation } = useGeolocation(); 
  const { currentRate, refresh: refreshRate, isLoading: isRateLoading, lastUpdated: rateLastUpdated } = useExchangeRate(); 
  const { isSpinning, sakuraPetals, triggerSakura } = useSakuraAnimation(); 
  
  // 資料層：統一從 Firestore Hook 獲取所有集合的資料
  const { 
    itineraryItems, 
    expenses, 
    shoppingItems, 
    restaurants, 
    sightseeingSpots, 
    dbError 
  } = useFirestoreData(); 

  // UX 優化：讓桌面版也能像手機一樣拖曳捲動
  const mainContentDrag = useDraggableScroll({ direction: 'vertical' });

  // --- Performance Optimization (useMemo) ---
  // 效能關鍵點：這裡使用 useMemo 非常重要。
  // 若不使用，每次 App re-render (例如 sakura 動畫更新、地圖切換) 都會導致
  // 陣列重新 filter 和 sort，這在大資料量下會造成卡頓。
  const currentDayItems = useMemo(() => {
    return itineraryItems
      .filter(i => i.day === selectedDay && !i.deleted) 
      .sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time); // 字串時間排序 "09:00" vs "10:00"
      });
  }, [itineraryItems, selectedDay]); // 依賴項：只有當總行程或選擇天數改變時才重新計算

  const currentDayDeletedItems = useMemo(() => {
    return itineraryItems.filter(i => i.day === selectedDay && i.deleted);
  }, [itineraryItems, selectedDay]);
  
  // --- Handlers ---
  const handleFocus = (lat: number, lng: number) => {
      if (!showMap) setShowMap(true);
      setFocusedLocation({ lat, lng });
      // UX: 點擊地點後，自動捲動回頂部以便查看地圖
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
    } else {
      alert("定位中...請稍候");
    }
  };

  return (
    // Layout Strategy: 使用 fixed inset-0 鎖定整個視窗，避免瀏覽器原生的回彈效果 (Rubber-band effect)
    // 內容捲動由內部的 div (mainContentDrag) 處理
    <div className="fixed inset-0 w-full h-[100dvh] bg-wafu-paper flex flex-col overflow-hidden font-sans text-base">
      
      {/* Error Boundary UI: 處理資料庫權限錯誤 */}
      {dbError && (
        <div className="fixed inset-0 z-[20000] bg-black/80 flex flex-col items-center justify-center text-white p-8 text-center backdrop-blur-md">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">資料庫存取被拒</h2>
            <button onClick={() => window.location.reload()} className="bg-white text-black px-6 py-2 rounded-full font-bold active:scale-95 transition-transform">重新整理</button>
        </div>
      )}

      {/* Visual Effects: 獨立層級，不干擾主內容互動 */}
      <SakuraOverlay petals={sakuraPetals} />

      {/* Navigation: 頂部導航 */}
      <Header triggerSakura={triggerSakura} isSpinning={isSpinning} />

      {/* Main Content Area */}
      {/* 重要：overscroll-y-contain 防止捲動傳遞到 body */}
      <div 
        ref={mainContentDrag.ref} 
        {...mainContentDrag.events} 
        className={`flex-1 overflow-y-auto relative z-10 bg-wafu-paper overscroll-y-contain ${mainContentDrag.className.replace('select-none', '')}`}
      >
        <div key={activeTab} className="animate-fade-in-up-gentle min-h-full flex flex-col">
          
          {/* --- Tab Logic: Conditional Rendering --- */}
          {/* 這種寫法比 Router 更適合此類小型 App，因為狀態保留更簡單 */}
          
          {/* 1. 行程 Tab */}
          {activeTab === 'itinerary' && (
            <>
              <DateSelector selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
              
              <MapControls 
                showMap={showMap} 
                setShowMap={setShowMap} 
                userLocation={userLocation} 
                onCenterUser={handleCenterOnUser} 
              />

              {/* 地圖區塊：高度根據螢幕響應式調整 */}
              {showMap && (
                <div className="w-full h-48 sm:h-56 lg:h-72 relative z-0 border-b border-wafu-indigo/10 shadow-inner animate-fade-in">
                   <MapComponent items={currentDayItems} userLocation={userLocation} focusedLocation={focusedLocation} />
                </div>
              )}
              
              <div className="flex-1 pt-6 bg-seigaiha bg-top">
                <div key={selectedDay} className="animate-fade-in-up-gentle max-w-3xl mx-auto w-full">
                    <Itinerary 
                        dayIndex={selectedDay} 
                        items={currentDayItems} 
                        deletedItems={currentDayDeletedItems}
                        isTodo={selectedDay === 0}
                        userLocation={userLocation}
                        onFocus={handleFocus}
                    />
                </div>
              </div>
            </>
          )}

          {/* 2. 景點 Tab */}
          {activeTab === 'sightseeing' && (
            <>
                <MapControls 
                  showMap={showMap} 
                  setShowMap={setShowMap} 
                  userLocation={userLocation} 
                  onCenterUser={handleCenterOnUser} 
                />

                {showMap && (
                    <div className="w-full h-48 sm:h-56 lg:h-72 relative z-0 border-b border-wafu-indigo/10 shadow-inner animate-fade-in">
                        <MapComponent items={sightseeingSpots} userLocation={userLocation} focusedLocation={focusedLocation} />
                    </div>
                )}
                
                <div className="flex-1 pt-8 bg-seigaiha">
                   <div className="max-w-3xl mx-auto w-full">
                      <SightseeingList items={sightseeingSpots} userLocation={userLocation} onFocus={handleFocus} />
                   </div>
                </div>
            </>
          )}

          {/* 3. 美食 Tab */}
          {activeTab === 'food' && (
             <>
                <MapControls 
                  showMap={showMap} 
                  setShowMap={setShowMap} 
                  userLocation={userLocation} 
                  onCenterUser={handleCenterOnUser} 
                />

                {showMap && (
                    <div className="w-full h-48 sm:h-56 lg:h-72 relative z-0 border-b border-wafu-indigo/10 shadow-inner animate-fade-in">
                        <MapComponent items={restaurants} userLocation={userLocation} focusedLocation={focusedLocation} />
                    </div>
                )}
                
                <div className="flex-1 pt-8 bg-seigaiha">
                    <div className="max-w-3xl mx-auto w-full">
                      <FoodList items={restaurants} userLocation={userLocation} onFocus={handleFocus} />
                    </div>
                </div>
             </>
          )}

          {/* 4. 記帳 Tab */}
          {activeTab === 'money' && (
            <div className="flex-1 pt-8 bg-seigaiha">
              <div className="max-w-3xl mx-auto w-full">
                <ExpenseTracker expenses={expenses} currentRate={currentRate} refreshRate={refreshRate} isRateLoading={isRateLoading} rateLastUpdated={rateLastUpdated} />
              </div>
            </div>
          )}

          {/* 5. 伴手禮 Tab */}
          {activeTab === 'shop' && (
            <div className="flex-1 pt-8 bg-seigaiha">
              <div className="max-w-4xl mx-auto w-full">
                <ShoppingList items={shoppingItems} expenses={expenses} currentRate={currentRate} />
              </div>
            </div>
          )}
          
          {/* 6. 機票 Tab */}
          {activeTab === 'flight' && (
             // Padding fix: pb-28 預留底部導航欄的空間
             <div className="flex-1 pt-8 px-6 pb-28 bg-seigaiha">
                <div className="max-w-3xl mx-auto w-full">
                  <div className="mb-8 border-b border-wafu-indigo/10 pb-4">
                      <h2 className="text-3xl font-black font-serif text-wafu-indigo tracking-tight mb-2 drop-shadow-sm">機票資訊</h2>
                      <p className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                        <span>Booking Ref:</span>
                        <span className="text-wafu-gold font-mono">FO7V9A</span>
                      </p>
                  </div>
                  
                  {/* Flight Info Components */}
                  <h3 className="text-lg font-bold text-wafu-indigo mb-4 ml-2 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold-leaf shadow-[0_0_8px_rgba(191,164,111,0.6)]"></div>
                      <span className="tracking-widest">去程 (Outbound)</span>
                  </h3>
                  <FlightPass originCode="TPE" originCity="Taipei" destCode="UKB" destCity="Kobe" flightNum="JX 834" date="01/17 (Sat)" time="07:00 - 10:30" seat="12A, 12B" />

                  <h3 className="text-lg font-bold text-wafu-indigo mb-4 ml-2 flex items-center gap-3 mt-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-wafu-indigo shadow-[0_0_8px_rgba(24,54,84,0.6)]"></div>
                      <span className="tracking-widest">回程 (Inbound)</span>
                  </h3>
                  <FlightPass originCode="KIX" originCity="Osaka" destCode="TPE" destCity="Taipei" flightNum="JX 823" date="01/24 (Sat)" time="14:00 - 16:15" seat="12A, 12B" isReturn={true} />
                </div>
             </div>
          )}
        </div>
      </div>

      {/* 底部導航列 */}
      <BottomNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        shoppingCount={shoppingItems.filter(i => !i.bought && !i.deleted).length} 
      />
    </div>
  );
}
