
import { useState } from 'react';

// 花瓣粒子屬性介面定義
export interface Petal {
  id: number;           // 唯一 ID
  type: 'petal' | 'pollen'; // 類型：花瓣或金色花粉
  left: string;         // 水平起始位置 (%)
  duration: string;     // 動畫持續時間 (影響落下速度)
  delay: string;        // 動畫延遲啟動時間
  size: number;         // 大小 (px)
  color: string;        // Tailwind 顏色 class
  swayX: string;        // 左右搖擺幅度 (px)
  depthBlur: string;    // 景深模糊效果 (Tailwind blur class)
}

/**
 * 自訂 Hook: useSakuraAnimation
 * 用途：控制首頁的櫻花飄落互動特效
 */
export const useSakuraAnimation = () => {
  const [isSpinning, setIsSpinning] = useState(false); // 控制 Logo 旋轉動畫狀態
  const [sakuraPetals, setSakuraPetals] = useState<Petal[]>([]); // 儲存當前畫面上的花瓣陣列

  // 觸發櫻花動畫函式
  const triggerSakura = () => {
     // 防止動畫重複觸發 (Debounce)
     if (isSpinning) return;
     
     setIsSpinning(true);
     setTimeout(() => setIsSpinning(false), 2500); 

     // 1. 產生 100 片標準粉色花瓣
     const newPetals: Petal[] = Array.from({ length: 100 }).map((_, i) => ({
         id: Date.now() + i,
         type: 'petal',
         left: `${Math.random() * 100}%`,
         duration: `${Math.random() * 5 + 6}s`, // 6~11秒落地
         delay: `${Math.random() * 3}s`,        // 0~3秒內陸續出現
         size: Math.random() * 10 + 10,         // 10~24px 大小
         color: Math.random() > 0.6 ? 'text-pink-300' : 'text-pink-200',
         swayX: `${(Math.random() - 0.5) * 200}px`, // 隨機左右搖擺幅度
         depthBlur: Math.random() > 0.8 ? 'blur-[1px]' : 'blur-[0px]' // 30% 機率模糊，製造景深
     }));
     
     // 2. 產生 30 個金色花粉粒子 (增加華麗感)
     const newParticles: Petal[] = Array.from({ length: 30 }).map((_, i) => ({
         id: Date.now() + 1000 + i,
         type: 'pollen',
         left: `${Math.random() * 100}%`,
         duration: `${Math.random() * 4 + 8}s`, 
         delay: `${Math.random() * 2}s`,
         size: Math.random() * 1 + 1, // 極小光點
         color: 'bg-wafu-gold',
         swayX: `${(Math.random() - 0.5) * 100}px`,
         depthBlur: ''
     }));

     // 更新狀態以渲染花瓣
     setSakuraPetals(prev => [...prev, ...newPetals, ...newParticles]);
     
     // 14秒後自動清理 DOM 元素，避免過多 DOM 導致效能低落
     setTimeout(() => {
        setSakuraPetals(prev => prev.filter(p => !newPetals.includes(p) && !newParticles.includes(p)));
     }, 14000);
  };

  return { isSpinning, sakuraPetals, triggerSakura };
};
