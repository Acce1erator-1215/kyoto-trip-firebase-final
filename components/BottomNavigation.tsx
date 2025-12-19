import React from 'react';
import { useUI } from '../context/UIContext';
import { useData } from '../context/DataContext';
import { Icons } from './Icon';

export type Tab = 'itinerary' | 'sightseeing' | 'food' | 'money' | 'shop' | 'flight';

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useUI();
  const { shoppingItems } = useData();

  const shoppingCount = shoppingItems.filter(i => !i.bought && !i.deleted).length;

  return (
    // Update: 改為 absolute bottom-0。
    // 因為父容器已經鎖定為 h-[100svh]，這裡用 absolute 會準確貼在「可見區域」的底部，
    // 不會像 fixed 那樣被瀏覽器底部的工具列遮擋。
    <div className="absolute bottom-0 left-0 w-full md:w-auto md:left-1/2 md:-translate-x-1/2 md:bottom-8 z-50 transition-all duration-300 bg-wafu-paper/95 backdrop-blur-xl border-t border-wafu-indigo/5 md:bg-transparent md:backdrop-blur-none md:border-none">
       {/* 
          保留之前優化的 Padding 邏輯:
          pb-[calc(env(safe-area-inset-bottom)+0.75rem)]
       */}
       <div className="md:bg-wafu-paper/95 md:backdrop-blur-xl md:border md:border-wafu-indigo/10 md:rounded-full md:shadow-2xl shadow-[0_-5px_20px_rgba(24,54,84,0.02)] pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 md:pb-1 md:px-8">
          <div className="max-w-lg mx-auto w-full md:w-auto grid grid-cols-6 md:gap-8 px-1">
            <button onClick={() => setActiveTab('itinerary')} className={`relative z-10 group flex flex-col items-center justify-center gap-0.5 p-2 transition-all duration-300 active-bounce ${activeTab === 'itinerary' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}>
              <div className={`p-0.5 transition-all duration-500 ease-out ${activeTab === 'itinerary' ? 'transform -translate-y-0.5 scale-110' : ''}`}><Icons.Calendar strokeWidth={2.5} /></div>
              <span className={`text-[10px] font-black tracking-widest transition-all ${activeTab === 'itinerary' ? 'opacity-100 font-serif border-b-2 border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>行程</span>
            </button>

            <button onClick={() => setActiveTab('sightseeing')} className={`relative z-10 group flex flex-col items-center justify-center gap-0.5 p-2 transition-all duration-300 active-bounce ${activeTab === 'sightseeing' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}>
              <div className={`p-0.5 transition-all duration-500 ease-out ${activeTab === 'sightseeing' ? 'transform -translate-y-0.5 scale-110' : ''}`}><Icons.MapPin strokeWidth={2.5} /></div>
              <span className={`text-[10px] font-black tracking-widest transition-all ${activeTab === 'sightseeing' ? 'opacity-100 font-serif border-b-2 border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>景點</span>
            </button>

            <button onClick={() => setActiveTab('food')} className={`relative z-10 group flex flex-col items-center justify-center gap-0.5 p-2 transition-all duration-300 active-bounce ${activeTab === 'food' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}>
              <div className={`p-0.5 transition-all duration-500 ease-out ${activeTab === 'food' ? 'transform -translate-y-0.5 scale-110' : ''}`}><Icons.Utensils strokeWidth={2.5} /></div>
              <span className={`text-[10px] font-black tracking-widest transition-all ${activeTab === 'food' ? 'opacity-100 font-serif border-b-2 border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>美食</span>
            </button>

            <button onClick={() => setActiveTab('money')} className={`relative z-10 group flex flex-col items-center justify-center gap-0.5 p-2 transition-all duration-300 active-bounce ${activeTab === 'money' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}>
              <div className={`p-0.5 transition-all duration-500 ease-out ${activeTab === 'money' ? 'transform -translate-y-0.5 scale-110' : ''}`}><Icons.Wallet strokeWidth={2.5} /></div>
              <span className={`text-[10px] font-black tracking-widest transition-all ${activeTab === 'money' ? 'opacity-100 font-serif border-b-2 border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>記帳</span>
            </button>

            <button onClick={() => setActiveTab('shop')} className={`relative z-10 group flex flex-col items-center justify-center gap-0.5 p-2 transition-all duration-300 active-bounce ${activeTab === 'shop' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}>
              <div className={`relative p-0.5 transition-all duration-500 ease-out ${activeTab === 'shop' ? 'transform -translate-y-0.5 scale-110' : ''}`}>
                <Icons.ShoppingBag strokeWidth={2.5} />
                {shoppingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold-leaf text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white shadow-sm font-bold animate-pop">
                    {shoppingCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-black tracking-widest transition-all ${activeTab === 'shop' ? 'opacity-100 font-serif border-b-2 border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>伴手禮</span>
            </button>
            
            <button onClick={() => setActiveTab('flight')} className={`relative z-10 group flex flex-col items-center justify-center gap-0.5 p-2 transition-all duration-300 active-bounce ${activeTab === 'flight' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}>
              <div className={`p-0.5 transition-all duration-500 ease-out ${activeTab === 'flight' ? 'transform -translate-y-0.5 scale-110' : ''}`}><Icons.Ticket strokeWidth={2.5} /></div>
              <span className={`text-[10px] font-black tracking-widest transition-all ${activeTab === 'flight' ? 'opacity-100 font-serif border-b-2 border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>機票</span>
            </button>
          </div>
       </div>
    </div>
  );
};