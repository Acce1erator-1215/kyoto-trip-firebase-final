
import React, { useState, useEffect } from 'react';
import { Icons } from '../Icon';

interface Props {
  totalYen: number; // 總日幣金額 (由父組件計算)
  totalTwd: number; // 總台幣金額 (由父組件計算)
  exchangeRate: number; // 全域匯率
  onRateChange: (newRate: number) => void; // 修改匯率 callback
  refreshRate?: () => void; // 強制刷新匯率
  isRateLoading?: boolean;
  rateLastUpdated?: Date | null;
}

/**
 * 支出總覽卡片 (ExpenseSummary)
 * 
 * 顯示於列表頂部的統計區塊，特色：
 * 1. 顯示總開銷 (JPY & TWD)
 * 2. 支援「點擊修改匯率」功能
 * 3. 顯示匯率最後更新時間
 */
export const ExpenseSummary: React.FC<Props> = ({
  totalYen,
  totalTwd,
  exchangeRate,
  onRateChange,
  refreshRate,
  isRateLoading,
  rateLastUpdated
}) => {
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [localRate, setLocalRate] = useState(exchangeRate);

  // 當外部匯率更新時，同步更新內部暫存狀態
  useEffect(() => {
    setLocalRate(exchangeRate);
  }, [exchangeRate]);

  return (
    <div className="bg-wafu-indigo text-white rounded-2xl p-6 shadow-xl border border-wafu-indigo/50 relative overflow-hidden mb-8">
        {/* 背景裝飾光暈 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-leaf opacity-10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        
        <div className="relative z-10">
            <div className="flex justify-between items-start">
                <h4 className="text-xs font-bold text-wafu-goldLight mb-3 uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2">
                    <Icons.Wallet />
                    <span>總支出統計</span>
                </h4>
                
                {/* 匯率設定區：支援點擊編輯 */}
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                        <span className="text-[10px] text-white/60 font-mono">Rate:</span>
                        {isEditingRate ? (
                            <input 
                                autoFocus
                                type="number"
                                className="w-16 bg-transparent text-white text-right text-xs font-mono font-bold focus:outline-none"
                                value={localRate}
                                step="0.001"
                                onChange={e => setLocalRate(parseFloat(e.target.value) || 0)}
                                onBlur={() => { setIsEditingRate(false); onRateChange(localRate); }}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') {
                                        setIsEditingRate(false);
                                        onRateChange(localRate);
                                    }
                                }}
                            />
                        ) : (
                            <span 
                                onClick={() => setIsEditingRate(true)}
                                className="text-xs font-mono font-bold text-white cursor-pointer border-b border-dashed border-white/40 hover:text-wafu-goldLight min-w-[3ch] text-right"
                            >
                                {exchangeRate.toFixed(3)}
                            </span>
                        )}
                        
                        {/* 匯率刷新按鈕 - isLoading 時強制旋轉 */}
                        {refreshRate && (
                            <button 
                                onClick={refreshRate}
                                className={`ml-1 text-white/60 hover:text-white transition-all duration-300 ${isRateLoading ? 'animate-spin text-wafu-goldLight' : ''}`}
                            >
                                <Icons.Refresh className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    {rateLastUpdated && (
                        <span className="text-[8px] text-white/40">
                            Updated: {rateLastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    )}
                </div>
            </div>
            
            {/* 金額顯示區 */}
            <div className="flex flex-col items-end">
                <div className="text-4xl font-black font-serif tracking-tight flex items-baseline gap-1">
                    <span className="text-xl font-normal opacity-70">¥</span>
                    <span>{totalYen.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="text-base font-bold text-wafu-goldLight mt-1 font-mono tracking-wide">
                    ≈ NT$ {totalTwd.toLocaleString()}
                </div>
            </div>
        </div>
    </div>
  );
};
