
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
 * 修正：
 * 1. 使用 createPortal 將 Modal 渲染到 body 層級，避免被父層 transform 屬性影響定位。
 * 2. 調整最大高度為 92dvh，盡量利用螢幕空間。
 * 3. 增加內容底部 padding，確保按鈕絕對不會被切掉。
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
    // 當 Modal 開啟時，鎖定背景捲動
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // 使用 Portal 將 Modal 渲染到 document.body
  return createPortal(
    <div className="fixed inset-0 z-[10050] flex items-end sm:items-center justify-center bg-wafu-indigo/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in touch-none">
      
      {/* 
         Modal 本體 
         max-h-[92dvh]: 增加高度限制，讓視窗更長
      */}
      <div 
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-wafu-border animate-modal-slide-up flex flex-col max-h-[92dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 1. Sticky Header (保持固定在頂部) */}
        <div className="shrink-0 px-5 py-4 flex items-center justify-between border-b border-wafu-indigo bg-wafu-indigo sm:rounded-t-xl shadow-md z-20 relative">
          <div className="w-6"></div> {/* 佔位符 */}
          
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

        {/* 2. Scrollable Content (內容與按鈕都在這裡面捲動) */}
        <div className="flex-1 overflow-y-auto relative bg-white overscroll-contain">
             {/* Background texture */}
             <div className="absolute inset-0 bg-wafu-paper opacity-50 pointer-events-none fixed"></div>

             <div className="relative z-10">
                {/* 內容區塊 */}
                <div className="p-5 pb-0">
                    {children}
                </div>

                {/* 按鈕區塊 (移入捲動區) */}
                {/* pb-20: 增加底部緩衝，確保一定滑得到 */}
                <div className="p-5 pt-8 pb-20">
                    <div className="flex gap-4">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 font-bold hover:bg-stone-100 transition-colors active:scale-95"
                    >
                        取消
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={confirmDisabled || isSubmitting}
                        className="flex-[2] py-3 rounded-xl bg-wafu-indigo text-white font-bold shadow-washi hover:bg-wafu-darkIndigo disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
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
