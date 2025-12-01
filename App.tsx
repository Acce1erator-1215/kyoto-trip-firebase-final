import React, { useState, useRef, MouseEvent, useEffect } from 'react';
import { ItineraryItem, Expense, ShoppingItem, Restaurant, SightseeingSpot, DATES } from './types';
import { Itinerary } from './components/Itinerary';
import { ShoppingList } from './components/ShoppingList';
import { FoodList } from './components/FoodList'; 
import { SightseeingList } from './components/SightseeingList'; 
import { ExpenseTracker } from './components/ExpenseTracker';
import { Icons } from './components/Icon';
import { INITIAL_ITINERARY } from './services/mockData';

// Firebase Imports
import { db } from './firebase';
import { collection, onSnapshot, query, doc, setDoc, writeBatch } from 'firebase/firestore';

// Tab Types
type Tab = 'itinerary' | 'sightseeing' | 'food' | 'money' | 'shop' | 'flight';

// Petal for animation
interface Petal {
  id: number;
  left: string;
  duration: string;
  delay: string;
  size: number;
  color: string;
  // Physics Props
  swayX: string;
  depthBlur: string;
}

// Single Flight Boarding Pass Component
const FlightPass = ({ 
  originCode, originCity, destCode, destCity, 
  flightNum, date, time, seat, 
  isReturn = false 
}: {
  originCode: string, originCity: string, destCode: string, destCity: string, 
  flightNum: string, date: string, time: string, seat: string, isReturn?: boolean
}) => {
  const [isFlying, setIsFlying] = useState(false);

  const handleFlightClick = () => {
    if(isFlying) return;
    setIsFlying(true);
    setTimeout(() => setIsFlying(false), 2000); // Reset after animation
  };

  return (
    <div 
      onClick={handleFlightClick}
      className={`bg-white rounded-3xl shadow-luxury border border-stone-100 overflow-hidden relative mb-6 transition-all duration-300 cursor-pointer active:scale-[0.98] select-none group 
      ${isFlying ? 'animate-card-bump' : 'hover:scale-[1.01] hover:shadow-2xl'}`}
    >
      <div className="absolute inset-0 bg-wafu-paper opacity-60 pointer-events-none mix-blend-multiply"></div>
      
      {/* Header Strip - Luxury Gold Inlay look */}
      <div className={`h-1.5 w-full absolute top-0 ${isReturn ? 'bg-wafu-indigo' : 'bg-gold-leaf shadow-md'}`}></div>
      
      <div className="p-6 pt-10 relative z-10">
         {/* Route */}
         <div className="flex items-center justify-between mb-8">
           <div className="flex flex-col">
             <span className="text-4xl font-black font-serif text-wafu-indigo tracking-tighter drop-shadow-sm">{originCode}</span>
             <span className="text-[10px] text-stone-400 font-bold tracking-[0.2em] uppercase mt-1">{originCity}</span>
           </div>
           
           <div className="flex-1 px-4 flex flex-col items-center opacity-80 group-hover:opacity-100 transition-opacity">
             {/* Plane Icon with Shoot Animation */}
             <div className="relative z-10 w-8 h-8 flex items-center justify-center">
                 <div className={`text-wafu-gold transition-all duration-300 relative
                     ${isFlying 
                        ? (isReturn ? 'animate-plane-shoot-left' : 'animate-plane-shoot-right') 
                        : (isReturn ? 'rotate-[185deg]' : '-rotate-5') + ' animate-fly'
                     }
                 `}>
                    <Icons.Plane />
                    
                    {/* Flowing Gold Trail (Only during flight) */}
                    {isFlying && (
                        <div className={`absolute top-1/2 -mt-0.5 h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent blur-[1px] rounded-full animate-pulse
                           ${isReturn 
                             ? 'left-full w-28 origin-left' 
                             : 'right-full w-28 origin-right'
                           }
                        `}></div>
                    )}
                 </div>
             </div>
             
             {/* Path Line */}
             <div className="w-full h-px bg-stone-200 relative mt-2">
               <div className="absolute right-0 top-1/2 -mt-[3px] w-1.5 h-1.5 bg-stone-300 rounded-full box-border border border-white"></div>
               <div className="absolute left-0 top-1/2 -mt-[3px] w-1.5 h-1.5 bg-wafu-indigo rounded-full box-border border border-white"></div>
             </div>
           </div>
           
           <div className="flex flex-col items-end">
             <span className="text-4xl font-black font-serif text-wafu-indigo tracking-tighter drop-shadow-sm">{destCode}</span>
             <span className="text-[10px] text-stone-400 font-bold tracking-[0.2em] uppercase mt-1">{destCity}</span>
           </div>
         </div>

         {/* Details Grid */}
         <div className="grid grid-cols-2 gap-y-7 gap-x-4">
           <div>
             <p className="text-[9px] text-stone-400 uppercase font-bold tracking-widest mb-1.5">Flight</p>
             <p className="text-xl font-bold text-wafu-indigo font-serif tracking-wide">{flightNum}</p>
           </div>
           <div className="text-right">
              <p className="text-[9px] text-stone-400 uppercase font-bold tracking-widest mb-1.5">Seat</p>
              <p className="text-xl font-bold text-wafu-indigo font-serif tracking-wide">{seat}</p>
           </div>
           <div>
              <p className="text-[9px] text-stone-400 uppercase font-bold tracking-widest mb-1.5">Date</p>
              <p className="text-base font-bold text-wafu-text font-serif tracking-wide">{date}</p>
           </div>
           <div className="text-right">
              <p className="text-[9px] text-stone-400 uppercase font-bold tracking-widest mb-1.5">Time</p>
              <p className="text-base font-bold text-wafu-text font-serif tracking-wide">{time}</p>
           </div>
         </div>
      </div>

      {/* Footer / Cutoff - Refined with shadows */}
      <div className="bg-stone-50/80 backdrop-blur-sm px-6 py-5 border-t border-dashed border-stone-300 flex justify-between items-center relative z-10">
        <div className="w-5 h-5 bg-wafu-bg rounded-full absolute -top-3 -left-3 border border-stone-200 shadow-inner"></div>
        <div className="w-5 h-5 bg-wafu-bg rounded-full absolute -top-3 -right-3 border border-stone-200 shadow-inner"></div>
        
        <div className="flex flex-col">
           <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Class</span>
           <span className="text-sm font-bold text-wafu-text font-serif">Economy</span>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Airline</span>
           <span className="text-sm font-bold text-wafu-text font-serif">Starlux</span>
        </div>
      </div>
    </div>
  );
};

// Enhanced Hook to support Vertical or Horizontal Dragging
const useDraggableScroll = ({ direction = 'horizontal' }: { direction?: 'horizontal' | 'vertical' } = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startPos = useRef(0);
  const scrollStart = useRef(0);
  const isDragging = useRef(false);

  const onMouseDown = (e: MouseEvent) => {
    if (!ref.current) return;
    isDown.current = true;
    isDragging.current = false;
    
    if (direction === 'horizontal') {
      startPos.current = e.pageX - ref.current.offsetLeft;
      scrollStart.current = ref.current.scrollLeft;
    } else {
      startPos.current = e.pageY - ref.current.offsetTop;
      scrollStart.current = ref.current.scrollTop;
    }
  };

  const onMouseLeave = () => {
    isDown.current = false;
    isDragging.current = false;
  };

  const onMouseUp = () => {
    isDown.current = false;
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDown.current || !ref.current) return;
    e.preventDefault();
    
    if (direction === 'horizontal') {
      const x = e.pageX - ref.current.offsetLeft;
      const walk = (x - startPos.current) * 2; 
      ref.current.scrollLeft = scrollStart.current - walk;
      if (Math.abs(x - startPos.current) > 5) isDragging.current = true;
    } else {
      const y = e.pageY - ref.current.offsetTop;
      const walk = (y - startPos.current) * 2; 
      ref.current.scrollTop = scrollStart.current - walk;
      if (Math.abs(y - startPos.current) > 5) isDragging.current = true;
    }
  };

  const onEntryClick = (callback: () => void) => {
    if (!isDragging.current) {
      callback();
    }
  };

  const cursorClass = direction === 'horizontal' 
    ? "cursor-grab active:cursor-grabbing touch-pan-x" 
    : "cursor-grab active:cursor-grabbing touch-pan-y";

  return { 
    ref, 
    events: { onMouseDown, onMouseLeave, onMouseUp, onMouseMove }, 
    onEntryClick,
    className: `${cursorClass} select-none no-scrollbar` 
  };
};

const getDayKanji = (index: number) => {
  const kanjiDays = ['準備', '初日', '二日', '三日', '四日', '五日', '六日', '七日', '八日'];
  return kanjiDays[index] || `Day ${index}`;
};

// Independent DateSelector Component
const DateSelector = ({ 
  selectedDay, 
  setSelectedDay 
}: { 
  selectedDay: number, 
  setSelectedDay: (d: number) => void 
}) => {
  const scrollLogic = useDraggableScroll({ direction: 'horizontal' });
  
  return (
    <div className="sticky top-0 z-20 bg-wafu-bg/85 backdrop-blur-xl border-b border-white/20 pb-2 pt-2 px-0 shadow-glass transition-all">
      <div 
        ref={scrollLogic.ref}
        {...scrollLogic.events}
        className={`flex overflow-x-auto gap-3 px-5 pb-1 ${scrollLogic.className}`}
      >
        <button
          type="button"
          onClick={() => scrollLogic.onEntryClick(() => setSelectedDay(0))}
          className={`shrink-0 flex items-center justify-center gap-2 px-4 h-[44px] rounded-xl border transition-all duration-300 active-bounce relative overflow-hidden group
            ${selectedDay === 0 
              ? 'bg-wafu-indigo text-white border-wafu-indigo shadow-lg gold-glow ring-1 ring-wafu-indigo/50' 
              : 'bg-white/80 text-stone-400 border-transparent hover:border-wafu-indigo/20 hover:bg-white shadow-sm'}`}
        >
           <span className="text-xs font-serif font-bold whitespace-nowrap tracking-widest">準備</span>
           {selectedDay === 0 && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-leaf"></div>}
        </button>
        
        {DATES.map((date, idx) => {
          const dayNum = idx + 1;
          const dayLabel = getDayKanji(dayNum);
          const dateParts = date.slice(5).split('-'); // [01, 17]
          const isSelected = selectedDay === dayNum;
          return (
            <button
              key={date}
              type="button"
              onClick={() => scrollLogic.onEntryClick(() => setSelectedDay(dayNum))}
              className={`shrink-0 flex items-center justify-center gap-2 px-3 h-[44px] rounded-xl border transition-all duration-300 active-bounce relative overflow-hidden
                ${isSelected 
                  ? 'bg-wafu-indigo text-white border-wafu-indigo shadow-lg gold-glow ring-1 ring-wafu-indigo/50' 
                  : 'bg-white/80 text-stone-500 border-transparent hover:border-wafu-indigo/20 hover:bg-white shadow-sm'}`}
            >
              {isSelected && (
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/washi.png')] mix-blend-overlay"></div>
              )}
              {isSelected && <div className="absolute top-0 right-0 w-4 h-4 bg-gold-leaf opacity-100" style={{clipPath: 'polygon(100% 0, 0 0, 100% 100%)'}}></div>}

              <div className="flex flex-col items-start leading-none gap-1">
                 <span className={`text-xs font-serif font-bold tracking-widest ${isSelected ? 'text-white' : 'text-wafu-indigo'}`}>{dayLabel}</span>
                 <div className={`text-[9px] tracking-tighter font-mono flex gap-0.5 ${isSelected ? 'text-white/70' : 'text-stone-300'}`}>
                   <span>{dateParts[0]}</span><span className="opacity-50">/</span><span>{dateParts[1]}</span>
                 </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('itinerary');
  const [selectedDay, setSelectedDay] = useState<number>(1); // 0=Todo, 1..8
  const [dbError, setDbError] = useState(false);
  
  // -- Cloud Data States --
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [sightseeingSpots, setSightseeingSpots] = useState<SightseeingSpot[]>([]);

  // Guard to prevent multiple seeded writes in a single session
  const seedAttempted = useRef(false);

  // -- Firebase Real-time Listeners --
  useEffect(() => {
    const handleSnapshotError = (err: any) => {
        console.error("Firebase Snapshot Error:", err);
        if (err.code === 'permission-denied') {
            setDbError(true);
        }
    };

    // 1. Itinerary
    const unsubItinerary = onSnapshot(query(collection(db, 'itinerary')), async (snapshot) => {
      if (snapshot.empty && !seedAttempted.current) {
         seedAttempted.current = true;
         // Auto-seed data for testing purposes as requested
         console.log("Empty itinerary detected. Seeding initial data...");
         const batch = writeBatch(db);
         INITIAL_ITINERARY.forEach(item => {
            const ref = doc(db, 'itinerary', item.id);
            batch.set(ref, item);
         });
         try {
            await batch.commit();
            console.log("Initial data seeded successfully.");
         } catch (e) {
            console.error("Failed to seed data:", e);
         }
      } else {
         const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItineraryItem));
         setItineraryItems(items);
         setDbError(false);
      }
    }, handleSnapshotError);

    // 2. Expenses
    const unsubExpenses = onSnapshot(query(collection(db, 'expenses')), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(items);
    }, handleSnapshotError);

    // 3. Shopping
    const unsubShopping = onSnapshot(query(collection(db, 'shopping')), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShoppingItem));
      setShoppingItems(items);
    }, handleSnapshotError);

    // 4. Restaurants
    const unsubRestaurants = onSnapshot(query(collection(db, 'restaurants')), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
      setRestaurants(items);
    }, handleSnapshotError);

    // 5. Sightseeing
    const unsubSightseeing = onSnapshot(query(collection(db, 'sightseeing')), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SightseeingSpot));
      setSightseeingSpots(items);
    }, handleSnapshotError);

    // Cleanup on unmount
    return () => {
      unsubItinerary();
      unsubExpenses();
      unsubShopping();
      unsubRestaurants();
      unsubSightseeing();
    };
  }, []);
  
  // Animation State
  const [isSpinning, setIsSpinning] = useState(false);
  const [sakuraPetals, setSakuraPetals] = useState<Petal[]>([]);

  // Vertical Drag Logic for Main Content
  const mainContentDrag = useDraggableScroll({ direction: 'vertical' });

  // Filter items for current view - EXCLUDE DELETED
  const currentDayItems = itineraryItems.filter(i => i.day === selectedDay && !i.deleted).sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  // Get deleted items for current day to pass to trash bin
  const currentDayDeletedItems = itineraryItems.filter(i => i.day === selectedDay && i.deleted);
  
  // Sakura Interaction
  const triggerSakura = () => {
     if (isSpinning) return;
     setIsSpinning(true);
     setTimeout(() => setIsSpinning(false), 2500); 

     // Create random petals with physics properties
     const newPetals: Petal[] = Array.from({ length: 30 }).map((_, i) => ({
         id: Date.now() + i,
         left: `${Math.random() * 100}%`,
         duration: `${Math.random() * 5 + 6}s`, // Slower fall (6-11s)
         delay: `${Math.random() * 3}s`,
         size: Math.random() * 14 + 10,
         color: Math.random() > 0.6 ? 'text-pink-300' : 'text-pink-200',
         swayX: `${(Math.random() - 0.5) * 200}px`, // Sway distance
         depthBlur: Math.random() > 0.7 ? 'blur-[1px]' : 'blur-[0px]' // Simulate Depth of Field
     }));
     
     setSakuraPetals(prev => [...prev, ...newPetals]);
     
     // Cleanup after animation
     setTimeout(() => {
        setSakuraPetals(prev => prev.filter(p => !newPetals.includes(p)));
     }, 14000);
  };

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-wafu-paper relative flex flex-col shadow-2xl overflow-hidden font-sans text-base ring-1 ring-black/5">
      
      {/* Database Error Overlay */}
      {dbError && (
        <div className="fixed inset-0 z-[10000] bg-black/80 flex flex-col items-center justify-center text-white p-8 text-center backdrop-blur-md">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">資料庫存取被拒</h2>
            <p className="text-sm opacity-80 mb-6">
                請確認 Firebase Console 的 Firestore Rules 是否已設為測試模式 (allow read, write: if true;)。
            </p>
            <button 
                onClick={() => window.location.reload()}
                className="bg-white text-black px-6 py-2 rounded-full font-bold active:scale-95 transition-transform"
            >
                重新整理
            </button>
        </div>
      )}

      {/* Falling Sakura Petals Overlay with Physics */}
      {sakuraPetals.map(petal => (
        <div
          key={petal.id}
          className={`fixed z-50 pointer-events-none animate-sakura-fall ${petal.color} ${petal.depthBlur}`}
          style={{
            left: petal.left,
            width: petal.size,
            height: petal.size,
            animationDuration: petal.duration,
            animationDelay: petal.delay,
            '--sway-x': petal.swayX, // Pass sway to CSS variable
          } as React.CSSProperties}
        >
          <Icons.SakuraPetal />
        </div>
      ))}

      {/* Header - Luxury Sakura - REDUCED HEIGHT BUT LARGER FONT */}
      <div className="relative z-30 pt-10 pb-3 px-5 flex justify-between items-center bg-wafu-bg/85 backdrop-blur-xl border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.02)] shrink-0 transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-wafu-gold/20 via-wafu-gold to-wafu-gold/20"></div>

        <div className="flex items-center gap-4 cursor-pointer active-bounce group" onClick={triggerSakura}>
           {/* Sakura Crest - Larger Size */}
           <div className={`w-12 h-12 relative shrink-0 text-wafu-indigo filter drop-shadow-sm group-hover:drop-shadow-md transition-all ${isSpinning ? 'animate-jump-spin' : ''}`}>
              <Icons.Sakura />
           </div>
           <div>
             {/* Title - Tweaked to text-2xl as requested */}
             <h1 className="text-2xl font-serif font-black text-wafu-indigo tracking-[0.2em] leading-none text-gold-leaf mb-1 drop-shadow-sm">
               京都八日遊
             </h1>
             <p className="text-[9px] text-wafu-gold font-bold tracking-[0.4em] uppercase opacity-90 pl-0.5 font-serif">Kyoto Journey</p>
           </div>
        </div>
        <a 
          href="https://www.vjw.digital.go.jp/" 
          target="_blank" 
          rel="noreferrer"
          className="group relative flex flex-col items-center justify-center w-9 h-9 bg-wafu-indigo text-white rounded-xl shadow-lg hover:shadow-xl hover:bg-wafu-darkIndigo transition-all duration-300 active-bounce overflow-hidden ring-1 ring-white/20"
        >
          <div className="scale-90 opacity-90 group-hover:opacity-100 transition-opacity"><Icons.QrCode /></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-gold-leaf rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </a>
      </div>

      {/* Content Area - Vertically Draggable */}
      <div 
        ref={mainContentDrag.ref}
        {...mainContentDrag.events}
        className={`flex-1 overflow-y-auto relative z-10 bg-wafu-paper ${mainContentDrag.className}`}
      >
        <div key={activeTab} className="animate-fade-in-up-gentle min-h-full flex flex-col">
          {activeTab === 'itinerary' && (
            <>
              <DateSelector selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
              <div className="flex-1 pt-6 pb-32 bg-seigaiha bg-fixed bg-top">
                {/* Wrap Itinerary in a key'd div to trigger animation on day switch */}
                <div key={selectedDay} className="animate-fade-in-up-gentle">
                    <Itinerary 
                        dayIndex={selectedDay} 
                        items={currentDayItems} 
                        deletedItems={currentDayDeletedItems}
                        // setItems is not passed as state setter, logic is inside Itinerary
                        setItems={() => {}} 
                        isTodo={selectedDay === 0}
                    />
                </div>
              </div>
            </>
          )}

          {activeTab === 'sightseeing' && (
            <div className="pt-8 min-h-screen bg-seigaiha bg-fixed">
              <SightseeingList items={sightseeingSpots} setItems={() => {}} />
            </div>
          )}

          {activeTab === 'food' && (
            <div className="pt-8 min-h-screen bg-seigaiha bg-fixed">
              <FoodList items={restaurants} setItems={() => {}} />
            </div>
          )}

          {activeTab === 'money' && (
            <div className="pt-8 min-h-screen bg-seigaiha bg-fixed">
              <ExpenseTracker expenses={expenses} setExpenses={() => {}} />
            </div>
          )}

          {activeTab === 'shop' && (
            <div className="pt-8 min-h-screen bg-seigaiha bg-fixed">
              <ShoppingList items={shoppingItems} setItems={() => {}} expenses={expenses} setExpenses={() => {}} />
            </div>
          )}
          
          {activeTab === 'flight' && (
             <div className="pt-8 px-6 min-h-screen bg-seigaiha bg-fixed pb-32">
                <div className="mb-8 border-b border-wafu-indigo/10 pb-4">
                    <h2 className="text-3xl font-black font-serif text-wafu-indigo tracking-tight mb-2 drop-shadow-sm">機票資訊</h2>
                    <p className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                      <span>Booking Ref:</span>
                      <span className="text-wafu-gold font-mono">FO7V9A</span>
                    </p>
                </div>
                
                <h3 className="text-sm font-bold text-wafu-indigo mb-4 ml-2 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold-leaf shadow-[0_0_8px_rgba(191,164,111,0.6)]"></div>
                    <span className="tracking-widest">去程 (Outbound)</span>
                </h3>
                <FlightPass 
                  originCode="TPE" originCity="Taipei" 
                  destCode="UKB" destCity="Kobe"
                  flightNum="JX 834"
                  date="01/17 (Sat)"
                  time="07:00 - 10:30"
                  seat="12A, 12B"
                />

                <h3 className="text-sm font-bold text-wafu-indigo mb-4 ml-2 flex items-center gap-3 mt-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-wafu-indigo shadow-[0_0_8px_rgba(24,54,84,0.6)]"></div>
                    <span className="tracking-widest">回程 (Inbound)</span>
                </h3>
                <FlightPass 
                  originCode="KIX" originCity="Osaka" 
                  destCode="TPE" destCity="Taipei"
                  flightNum="JX 823"
                  date="01/24 (Sat)"
                  time="14:00 - 16:15"
                  seat="12A, 12B"
                  isReturn={true}
                />
             </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation with iOS Safe Area Padding - GLASS EFFECT */}
      <div className="bg-wafu-paper/85 backdrop-blur-xl border-t border-white/50 grid grid-cols-6 px-1 pt-2 z-50 shrink-0 shadow-[0_-5px_25px_rgba(24,54,84,0.05)] relative pb-[env(safe-area-inset-bottom)]">
        {/* Subtle highlight line at top */}
        <div className="absolute top-0 left-0 w-full h-px bg-white/60"></div>

        <button 
          onClick={() => setActiveTab('itinerary')}
          className={`relative z-10 group flex flex-col items-center justify-center gap-1 transition-all duration-300 active-bounce py-2 ${activeTab === 'itinerary' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}
        >
          <div className={`p-1 transition-all duration-500 ease-out ${activeTab === 'itinerary' ? 'transform -translate-y-1 drop-shadow-md' : ''}`}>
             <Icons.Calendar />
          </div>
          <span className={`text-[9px] font-bold tracking-widest transition-all ${activeTab === 'itinerary' ? 'opacity-100 font-serif border-b border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>行程</span>
        </button>

        <button 
          onClick={() => setActiveTab('sightseeing')}
          className={`relative z-10 group flex flex-col items-center justify-center gap-1 transition-all duration-300 active-bounce py-2 ${activeTab === 'sightseeing' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}
        >
          <div className={`p-1 transition-all duration-500 ease-out ${activeTab === 'sightseeing' ? 'transform -translate-y-1 drop-shadow-md' : ''}`}>
             <Icons.MapPin />
          </div>
          <span className={`text-[9px] font-bold tracking-widest transition-all ${activeTab === 'sightseeing' ? 'opacity-100 font-serif border-b border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>景點</span>
        </button>

        <button 
          onClick={() => setActiveTab('food')}
          className={`relative z-10 group flex flex-col items-center justify-center gap-1 transition-all duration-300 active-bounce py-2 ${activeTab === 'food' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}
        >
          <div className={`p-1 transition-all duration-500 ease-out ${activeTab === 'food' ? 'transform -translate-y-1 drop-shadow-md' : ''}`}>
             <Icons.Utensils />
          </div>
          <span className={`text-[9px] font-bold tracking-widest transition-all ${activeTab === 'food' ? 'opacity-100 font-serif border-b border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>美食</span>
        </button>

        <button 
          onClick={() => setActiveTab('money')}
          className={`relative z-10 group flex flex-col items-center justify-center gap-1 transition-all duration-300 active-bounce py-2 ${activeTab === 'money' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}
        >
          <div className={`p-1 transition-all duration-500 ease-out ${activeTab === 'money' ? 'transform -translate-y-1 drop-shadow-md' : ''}`}>
             <Icons.Wallet />
          </div>
          <span className={`text-[9px] font-bold tracking-widest transition-all ${activeTab === 'money' ? 'opacity-100 font-serif border-b border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>記帳</span>
        </button>

        <button 
          onClick={() => setActiveTab('shop')}
          className={`relative z-10 group flex flex-col items-center justify-center gap-1 transition-all duration-300 active-bounce py-2 ${activeTab === 'shop' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}
        >
          <div className={`relative p-1 transition-all duration-500 ease-out ${activeTab === 'shop' ? 'transform -translate-y-1 drop-shadow-md' : ''}`}>
             <Icons.ShoppingBag />
             {shoppingItems.filter(i => !i.bought && !i.deleted).length > 0 && (
               <span className="absolute -top-1 -right-1 bg-gold-leaf text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white shadow-sm font-bold animate-pop">
                 {shoppingItems.filter(i => !i.bought && !i.deleted).length}
               </span>
             )}
          </div>
          <span className={`text-[9px] font-bold tracking-widest transition-all ${activeTab === 'shop' ? 'opacity-100 font-serif border-b border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>伴手禮</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('flight')}
          className={`relative z-10 group flex flex-col items-center justify-center gap-1 transition-all duration-300 active-bounce py-2 ${activeTab === 'flight' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}
        >
          <div className={`p-1 transition-all duration-500 ease-out ${activeTab === 'flight' ? 'transform -translate-y-1 drop-shadow-md' : ''}`}>
             <Icons.Ticket />
          </div>
          <span className={`text-[9px] font-bold tracking-widest transition-all ${activeTab === 'flight' ? 'opacity-100 font-serif border-b border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>機票</span>
        </button>
      </div>
    </div>
  );
}