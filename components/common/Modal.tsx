
import React from 'react';

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
 * 封裝了背景模糊、動畫效果、Header 樣式與底部按鈕邏輯
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
  if (!isOpen) return null;

  return (
    // items-end (手機底部對齊) sm:items-center (桌面置中)
    // p-0 (手機滿版底部) sm:p-4 (桌面有邊距)
    <div className="fixed inset-0 z-[10050] flex items-end sm:items-center justify-center bg-wafu-indigo/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      {/* 
         調整: max-h-[92dvh] 讓彈窗在手機上能運用更多垂直空間
         rounded-t-2xl (手機僅上方圓角) sm:rounded-2xl (桌面全圓角) 
      */}
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-wafu-border animate-modal-slide-up flex flex-col max-h-[92dvh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-wafu-indigo bg-wafu-indigo sm:rounded-t-xl shadow-md z-20">
          <button 
            onClick={onClose} 
            className="text-white/80 font-bold text-sm hover:text-white transition-colors active-bounce px-2"
          >
            取消
          </button>
          
          <div className="font-bold text-white font-serif text-lg tracking-widest">
            {title}
          </div>
          
          <button 
            onClick={onConfirm} 
            disabled={confirmDisabled || isSubmitting} 
            className="bg-white text-wafu-indigo text-sm px-4 py-1.5 rounded-lg font-bold shadow-sm hover:bg-stone-100 disabled:opacity-50 disabled:shadow-none transition-all active-bounce flex items-center gap-2"
          >
            {isSubmitting ? '...' : confirmLabel}
          </button>
        </div>

        {/* 
           Modal Content 
           調整: pb-32 (底部增加大量緩衝空間，確保內容可被捲動至上方，不會被鍵盤或底部工具列遮擋)
        */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 relative bg-white overscroll-contain">
          <div className="absolute inset-0 bg-wafu-paper opacity-50 pointer-events-none"></div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
