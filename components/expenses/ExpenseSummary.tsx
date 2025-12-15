
import React, { useState, useEffect } from 'react';
import { Icons } from '../Icon';

interface Props {
  totalYen: number;
  totalTwd: number;
  exchangeRate: number;
  onRateChange: (newRate: number) => void;
  refreshRate?: () => void;
  isRateLoading?: boolean;
  rateLastUpdated?: Date | null;
}

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

  useEffect(() => {
    setLocalRate(exchangeRate);
  }, [exchangeRate]);

  return (
    <div className="bg-wafu-indigo text-white rounded-2xl p-6 shadow-xl border border-wafu-indigo/50 relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-leaf opacity-10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        
        <div className="relative z-10">
            <div className="flex justify-between items-start">
                <h4 className="text-xs font-bold text-wafu-goldLight mb-3 uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2">
                    <Icons.Wallet />
                    <span>總支出統計</span>
                </h4>
                
                {/* 匯率設定：點擊可手動修改 */}
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
                        {refreshRate && (
                            <button 
                                onClick={refreshRate}
                                className={`ml-1 text-white/60 hover:text-white transition-colors ${isRateLoading ? 'animate-spin' : ''}`}
                            >
                                <Icons.Refresh className="w-3 h-3" />
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
