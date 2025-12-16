
import React, { useEffect, useState } from 'react';
import { Icons } from '../Icon';

export type ToastType = 'success' | 'error' | 'info';

interface Props {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<Props> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 動畫進入效果
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // 樣式設定
  const styles = {
    success: 'bg-wafu-indigo text-white border-wafu-gold shadow-luxury',
    error: 'bg-red-900/95 text-white border-red-700 shadow-lg',
    info: 'bg-stone-800/95 text-white border-stone-600 shadow-lg'
  };

  const icons = {
    success: <div className="text-wafu-gold"><Icons.Check /></div>,
    error: <div className="text-red-200"><Icons.X /></div>,
    info: <div className="text-stone-300"><Icons.MapPin /></div>
  };

  return (
    <div 
      className={`
        pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-500 ease-out transform cursor-pointer
        ${styles[type]}
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}
      `}
      onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }}
      role="alert"
    >
      <div className="shrink-0">{icons[type]}</div>
      <span className="text-sm font-bold tracking-wide font-serif">{message}</span>
    </div>
  );
};
