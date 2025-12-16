
import React, { useState, useEffect } from 'react';
import { Icons } from './Icon';

interface HeaderProps {
  triggerSakura: () => void;
  isSpinning: boolean;
}

/**
 * 頁面頂部 Header 組件
 */
export const Header: React.FC<HeaderProps> = ({ triggerSakura, isSpinning }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="relative z-30 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 px-5 bg-wafu-bg/85 backdrop-blur-xl border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.02)] shrink-0 transition-all duration-300">
      {/* 頂部金色裝飾線 */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-wafu-gold/20 via-wafu-gold to-wafu-gold/20"></div>

      <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
        {/* 左側：Logo 與 標題 (點擊觸發櫻花) */}
        <div className="flex items-center gap-4 cursor-pointer active-bounce group" onClick={triggerSakura}>
          <div className={`w-12 h-12 relative shrink-0 text-wafu-indigo filter drop-shadow-sm group-hover:drop-shadow-md transition-all ${isSpinning ? 'animate-jump-spin' : ''}`}>
              <Icons.Sakura />
              {/* 離線狀態指示燈 */}
              {!isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-stone-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
              )}
          </div>
          <div>
            <h1 className="text-2xl font-serif font-black text-wafu-indigo tracking-[0.2em] leading-none text-gold-leaf mb-1 drop-shadow-sm flex items-center gap-2">
                京都八日遊
                {!isOnline && (
                    <span className="text-[10px] bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded font-bold tracking-normal border border-stone-300">
                        OFFLINE
                    </span>
                )}
            </h1>
            <p className="text-[14px] text-wafu-gold font-bold tracking-[0.4em] uppercase opacity-90 pl-0.5 font-serif">Kyoto Journey</p>
          </div>
        </div>

        {/* 右側：Visit Japan Web 連結按鈕 */}
        <a href="https://www.vjw.digital.go.jp/" target="_blank" rel="noreferrer" className="group relative flex flex-col items-center justify-center w-9 h-9 bg-wafu-indigo text-white rounded-xl shadow-lg hover:shadow-xl hover:bg-wafu-darkIndigo transition-all duration-300 active-bounce overflow-hidden ring-1 ring-white/20">
          <div className="scale-90 opacity-90 group-hover:opacity-100 transition-opacity"><Icons.QrCode /></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 bg-gold-leaf rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </a>
      </div>
    </div>
  );
};
