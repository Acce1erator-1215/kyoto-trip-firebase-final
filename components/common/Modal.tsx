
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onConfirm: () => void;
  isSubmitting?: boolean;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  children: React.ReactNode;
}

/**
 * 通用模態框組件 (Reusable Modal)
 * 修正重點：
 * 1. 手機版改為 Bottom Sheet 模式：緊貼底部、僅上方圓角、高度最大化 (95dvh)。
 * 2. 按鈕移入 Scroll View：確保內容過長或鍵盤彈出時，使用者仍可捲動到底部點擊按鈕。
 * 3. 解決捲動問題：移除多餘的 fixed 定位，確保內容流暢捲動。
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  onConfirm,
  isSubmitting = false,
  confirmLabel = '儲存',
  confirmDisabled = false,
  children
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10050] flex items-end sm:items-center justify-center touch-none">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-wafu-indigo/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* 
         Modal 本體 
         手機版 (default): w-full, rounded-t-2xl (僅上方圓角), 貼底
         桌面版 (sm): rounded-2xl (全圓角), 懸浮置中
         max-h-[95dvh]: 極大化高度，方便顯示更多內容
      */}
      <div 
        className="relative bg-white w-full sm:w-[90%] sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border-t border-x sm:border border-wafu-border animate-modal-slide-up flex flex-col max-h-[95dvh] sm:max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header - 固定在頂部 */}
        <div className="shrink-0 px-5 py-4 flex items-center justify-between border-b border-wafu-indigo bg-wafu-indigo sm:rounded-t-xl shadow-md z-20 relative">
          <div className="w-6"></div>
          <div className="font-bold text-white font-serif text-lg tracking-widest truncate px-2">
            {title}
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white transition-colors active-bounce p-1"
          >
            <Icons.X />
          </button>
        </div>

        {/* Content Area - 可捲動區域 */}
        <div className="flex-1 overflow-y-auto relative bg-white overscroll-contain">
             {/* 紙張紋理背景 */}
             <div className="absolute inset-0 bg-wafu-paper opacity-50 pointer-events-none fixed"></div>

             <div className="relative z-10">
                {/* 表單內容 */}
                <div className="p-5 pb-2">
                    {children}
                </div>

                {/* 
                   Action Buttons - 放在捲動區域的最下方
                   pb-safe: 確保在 iPhone X 等有 Home Bar 的手機上，按鈕下方有足夠緩衝空間 
                   原本是 fixed 現在改為跟隨內容流動，解決鍵盤遮擋問題
                */}
                <div className="p-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                    <div className="flex gap-4">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 font-bold hover:bg-stone-100 transition-colors active:scale-95"
                        >
                            取消
                        </button>
                        <button 
                            onClick={onConfirm}
                            disabled={confirmDisabled || isSubmitting}
                            className="flex-[2] py-3.5 rounded-xl bg-wafu-indigo text-white font-bold shadow-washi hover:bg-wafu-darkIndigo disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                <span className="animate-spin text-lg">↻</span>
                                <span>處理中...</span>
                                </>
                            ) : (
                                <>
                                <Icons.Check />
                                <span>{confirmLabel}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
