
import React from 'react';
import { Icons } from './Icon';

export type Tab = 'itinerary' | 'sightseeing' | 'food' | 'money' | 'shop' | 'flight';

interface BottomNavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  shoppingCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab, shoppingCount }) => {
  return (
    // 修改：將 pb-4 改為 pb-0，完全移除底部安全區域留白
    <div className="fixed bottom-0 left-0 w-full bg-wafu-paper/95 backdrop-blur-xl border-t border-wafu-indigo/10 z-40 shadow-[0_-5px_25px_rgba(24,54,84,0.03)] pb-0 transition-all">
      
      <div className="max-w-lg mx-auto w-full grid grid-cols-6 px-1 py-2">
        <button onClick={() => setActiveTab('itinerary')} className={`relative z-10 group flex flex-col items-center justify-center gap-0.5 transition-all duration-300 active-bounce ${activeTab === 'itinerary' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}>
          <div className={`p-0.5 transition-all duration-500 ease-out ${activeTab === 'itinerary' ? 'transform -translate-y-1 drop-shadow-md' : ''}`}><Icons.Calendar strokeWidth={2.5} /></div>
          <span className={`text-[10px] font-black tracking-widest transition-all ${activeTab === 'itinerary' ? 'opacity-100 font-serif border-b border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>行程</span>
        </button>

        <button onClick={() => setActiveTab('sightseeing')} className={`relative z-10 group flex flex-col items-center justify-center gap-0.5 transition-all duration-300 active-bounce ${activeTab === 'sightseeing' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}>
          <div className={`p-0.5 transition-all duration-500 ease-out ${activeTab === 'sightseeing' ? 'transform -translate-y-1 drop-shadow-md' : ''}`}><Icons.MapPin strokeWidth={2.5} /></div>
          <span className={`text-[10px] font-black tracking-widest transition-all ${activeTab === 'sightseeing' ? 'opacity-100 font-serif border-b border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>景點</span>
        </button>

        <button onClick={() => setActiveTab('food')} className={`relative z-10 group flex flex-col items-center justify-center gap-0.5 transition-all duration-300 active-bounce ${activeTab === 'food' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}>
          <div className={`p-0.5 transition-all duration-500 ease-out ${activeTab === 'food' ? 'transform -translate-y-1 drop-shadow-md' : ''}`}><Icons.Utensils strokeWidth={2.5} /></div>
          <span className={`text-[10px] font-black tracking-widest transition-all ${activeTab === 'food' ? 'opacity-100 font-serif border-b border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>美食</span>
        </button>

        <button onClick={() => setActiveTab('money')} className={`relative z-10 group flex flex-col items-center justify-center gap-0.5 transition-all duration-300 active-bounce ${activeTab === 'money' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}>
          <div className={`p-0.5 transition-all duration-500 ease-out ${activeTab === 'money' ? 'transform -translate-y-1 drop-shadow-md' : ''}`}><Icons.Wallet strokeWidth={2.5} /></div>
          <span className={`text-[10px] font-black tracking-widest transition-all ${activeTab === 'money' ? 'opacity-100 font-serif border-b border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>記帳</span>
        </button>

        <button onClick={() => setActiveTab('shop')} className={`relative z-10 group flex flex-col items-center justify-center gap-0.5 transition-all duration-300 active-bounce ${activeTab === 'shop' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}>
          <div className={`relative p-0.5 transition-all duration-500 ease-out ${activeTab === 'shop' ? 'transform -translate-y-1 drop-shadow-md' : ''}`}>
            <Icons.ShoppingBag strokeWidth={2.5} />
            {shoppingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold-leaf text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white shadow-sm font-bold animate-pop">
                {shoppingCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-black tracking-widest transition-all ${activeTab === 'shop' ? 'opacity-100 font-serif border-b border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>伴手禮</span>
        </button>
        
        <button onClick={() => setActiveTab('flight')} className={`relative z-10 group flex flex-col items-center justify-center gap-0.5 transition-all duration-300 active-bounce ${activeTab === 'flight' ? 'text-wafu-indigo' : 'text-stone-400 hover:text-wafu-indigo/60'}`}>
          <div className={`p-0.5 transition-all duration-500 ease-out ${activeTab === 'flight' ? 'transform -translate-y-1 drop-shadow-md' : ''}`}><Icons.Ticket strokeWidth={2.5} /></div>
          <span className={`text-[10px] font-black tracking-widest transition-all ${activeTab === 'flight' ? 'opacity-100 font-serif border-b border-wafu-indigo pb-0.5' : 'opacity-60 scale-90'}`}>機票</span>
        </button>
      </div>
    </div>
  );
};
