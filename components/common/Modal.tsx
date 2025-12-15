
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
 * 
 * Code Review Notes:
 * 1. React Portal: 使用 createPortal 將 Modal 渲染到 document.body 下，
 *    避免受父組件的 CSS (overflow: hidden 或 z-index) 影響，確保層級正確。
 * 2. Accessibility (a11y): 當 Modal 開啟時鎖定 body scroll (document.body.style.overflow = 'hidden')，
 *    防止背景捲動。
 * 3. Mobile First Design: 採用 Bottom Sheet 樣式，適配手機單手操作。
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

  // Client-side only rendering check (for SSR safety, though this is SPA)
  useEffect(() => {
    setMounted(true);
    // Body Scroll Lock
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
      {/* Overlay Backdrop */}
      <div 
        className="absolute inset-0 bg-wafu-indigo/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* 
         Modal Container
         Layout Strategy:
         - Mobile: w-full, rounded-t-2xl (Bottom Sheet), attached to bottom.
         - Desktop: rounded-2xl, centered.
         - Height: max-h-[95dvh] ensures it fits within viewport with virtual keyboard awareness.
      */}
      <div 
        className="relative bg-white w-full sm:w-[90%] sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border-t border-x sm:border border-wafu-border animate-modal-slide-up flex flex-col max-h-[95dvh] sm:max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header - Fixed at top */}
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

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto relative bg-white overscroll-contain">
             {/* Background Texture */}
             <div className="absolute inset-0 bg-wafu-paper opacity-50 pointer-events-none fixed"></div>

             <div className="relative z-10">
                {/* Form Elements */}
                <div className="p-5 pb-2">
                    {children}
                </div>

                {/* 
                   Action Buttons - Footer
                   Layout Fix: 放在捲動區域底部而非 fixed，解決手機鍵盤遮擋問題。
                   pb-safe: 支援 iPhone X+ Home Indicator 區域。
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
