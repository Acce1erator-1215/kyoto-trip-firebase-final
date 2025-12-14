
import React from 'react';
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
         調整: 
         max-h-[92dvh] -> max-h-[85dvh]: 稍微縮減最大高度，避免太貼近瀏覽器邊緣導致誤觸或遮擋
         rounded-t-2xl (手機僅上方圓角) sm:rounded-2xl (桌面全圓角) 
      */}
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-wafu-border animate-modal-slide-up flex flex-col max-h-[85dvh] overflow-hidden">
        
        {/* Modal Header: 簡化為僅顯示標題與關閉按鈕 */}
        <div className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-wafu-indigo bg-wafu-indigo sm:rounded-t-xl shadow-md z-20 relative">
          <div className="w-6"></div> {/* 佔位符，為了讓標題視覺置中 */}
          
          <div className="font-bold text-white font-serif text-lg tracking-widest">
            {title}
          </div>
          
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white transition-colors active-bounce p-1"
          >
            <Icons.X />
          </button>
        </div>

        {/* 
           Modal Content & Footer
           按鈕移至此處，使其成為可捲動內容的一部分
           pb-12 -> pb-40: 大幅增加底部預留空間 (約 160px)，確保按鈕絕對可以被捲動出來，不會被手機下方 Bar 遮住
        */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-40 relative bg-white overscroll-contain">
          <div className="absolute inset-0 bg-wafu-paper opacity-50 pointer-events-none"></div>
          <div className="relative z-10">
            {children}

            {/* Scrollable Action Buttons (Footer) */}
            <div className="mt-6 pt-6 border-t border-dashed border-stone-200 flex gap-4">
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
  );
};
