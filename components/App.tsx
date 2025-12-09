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

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('itinerary'); 
  const [selectedDay, setSelectedDay] = useState<number>(1); 
  const [showMap, setShowMap] = useState<boolean>(true); 
  const [focusedLocation, setFocusedLocation] = useState<{lat: number, lng: number} | null>(null); 
  
  const { userLocation } = useGeolocation(); 
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

  const mainContentDrag = useDraggableScroll({ direction: 'vertical' });

  const currentDayItems = useMemo(() => {
    return itineraryItems
      .filter(i => i.day === selectedDay && !i.deleted) 
      .sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
  }, [itineraryItems, selectedDay]);

  const currentDayDeletedItems = useMemo(() => {
    return itineraryItems.filter(i => i.day === selectedDay && i.deleted);
  }, [itineraryItems, selectedDay]);
  
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
    } else {
      alert("定位中...請稍候");
    }
  };

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-wafu-paper relative flex flex-col shadow-2xl overflow-hidden font-sans text-base ring-1 ring-black/5">
      
      {/* 資料庫錯誤提示 (通常是權限問題) */}
      {dbError && (
        <div className="fixed inset-0 z-[20000] bg-black/80 flex flex-col items-center justify-center text-white p-8 text-center backdrop-blur-md">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">資料庫存取被拒</h2>
            <button onClick={() => window.location.reload()} className="bg-white text-black px-6 py-2 rounded-full font-bold active:scale-95 transition-transform">重新整理</button>
        </div>
      )}

      {/* 櫻花飄落特效層 */}
      <SakuraOverlay petals={sakuraPetals} />

      {/* 頂部導航欄 (重構：已抽離為獨立組件) */}
      <Header triggerSakura={triggerSakura} isSpinning={isSpinning} />

      {/* 主要內容捲動區 */}
      <div ref={mainContentDrag.ref} {...mainContentDrag.events} className={`flex-1 overflow-y-auto relative z-10 bg-wafu-paper ${mainContentDrag.className}`}>
        <div key={activeTab} className="animate-fade-in-up-gentle min-h-full flex flex-col">
          
          {/* 1. 行程 Tab */}
          {activeTab === 'itinerary' && (
            <>
              <DateSelector selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
              
              {/* 地圖控制列 (重構：已抽離) */}
              <MapControls 
                showMap={showMap} 
                setShowMap={setShowMap} 
                userLocation={userLocation} 
                onCenterUser={handleCenterOnUser} 
              />

              {/* 地圖組件 */}
              {showMap && (
                <div className="w-full h-48 sm:h-56 relative z-0 border-b border-wafu-indigo/10 shadow-inner animate-fade-in">
                   <MapComponent items={currentDayItems} userLocation={userLocation} focusedLocation={focusedLocation} />
                </div>
              )}
              
              {/* 行程列表 */}
              <div className="flex-1 pt-6 pb-32 bg-seigaiha bg-fixed bg-top">
                <div key={selectedDay} className="animate-fade-in-up-gentle">
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
                {/* 地圖控制列 (重構：重複使用) */}
                <MapControls 
                  showMap={showMap} 
                  setShowMap={setShowMap} 
                  userLocation={userLocation} 
                  onCenterUser={handleCenterOnUser} 
                />

                {showMap && (
                    <div className="w-full h-48 sm:h-56 relative z-0 border-b border-wafu-indigo/10 shadow-inner animate-fade-in">
                        <MapComponent items={sightseeingSpots} userLocation={userLocation} focusedLocation={focusedLocation} />
                    </div>
                )}
                <div className="pt-8 min-h-screen bg-seigaiha bg-fixed">
                    <SightseeingList items={sightseeingSpots} userLocation={userLocation} onFocus={handleFocus} />
                </div>
            </>
          )}

          {/* 3. 美食 Tab */}
          {activeTab === 'food' && (
             <>
                {/* 地圖控制列 (重構：重複使用) */}
                <MapControls 
                  showMap={showMap} 
                  setShowMap={setShowMap} 
                  userLocation={userLocation} 
                  onCenterUser={handleCenterOnUser} 
                />

                {showMap && (
                    <div className="w-full h-48 sm:h-56 relative z-0 border-b border-wafu-indigo/10 shadow-inner animate-fade-in">
                        <MapComponent items={restaurants} userLocation={userLocation} focusedLocation={focusedLocation} />
                    </div>
                )}
                <div className="pt-8 min-h-screen bg-seigaiha bg-fixed">
                    <FoodList items={restaurants} userLocation={userLocation} onFocus={handleFocus} />
                </div>
             </>
          )}

          {/* 4. 記帳 Tab */}
          {activeTab === 'money' && (
            <div className="pt-8 min-h-screen bg-seigaiha bg-fixed">
              <ExpenseTracker expenses={expenses} currentRate={currentRate} refreshRate={refreshRate} isRateLoading={isRateLoading} rateLastUpdated={rateLastUpdated} />
            </div>
          )}

          {/* 5. 伴手禮 Tab */}
          {activeTab === 'shop' && (
            <div className="pt-8 min-h-screen bg-seigaiha bg-fixed">
              <ShoppingList items={shoppingItems} expenses={expenses} currentRate={currentRate} />
            </div>
          )}
          
          {/* 6. 機票 Tab */}
          {activeTab === 'flight' && (
             <div className="pt-8 px-6 min-h-screen bg-seigaiha bg-fixed pb-32">
                <div className="mb-8 border-b border-wafu-indigo/10 pb-4">
                    <h2 className="text-3xl font-black font-serif text-wafu-indigo tracking-tight mb-2 drop-shadow-sm">機票資訊</h2>
                    <p className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                      <span>Booking Ref:</span>
                      <span className="text-wafu-gold font-mono">FO7V9A</span>
                    </p>
                </div>
                
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