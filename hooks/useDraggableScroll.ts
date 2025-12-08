
import { useRef, MouseEvent } from 'react';

/**
 * 自訂 Hook: useDraggableScroll
 * 用途：讓桌面版網頁的列表也能像手機 App 一樣「按住滑鼠拖曳捲動」
 * 適用：橫向捲動的日期列、直向捲動的內容區
 * 
 * @param direction 捲動方向 ('horizontal' | 'vertical')
 */
export const useDraggableScroll = ({ direction = 'horizontal' }: { direction?: 'horizontal' | 'vertical' } = {}) => {
  const ref = useRef<HTMLDivElement>(null); // 綁定到要捲動的容器 DOM
  const isDown = useRef(false);             // 滑鼠是否按下狀態
  const startPos = useRef(0);               // 滑鼠按下的起始座標 (X 或 Y)
  const scrollStart = useRef(0);            // 容器原本的捲動位置 (ScrollLeft 或 ScrollTop)
  const isDragging = useRef(false);         // 判斷是否發生了「拖曳」行為 (用於區分單純點擊)

  // 當滑鼠按下時
  const onMouseDown = (e: MouseEvent) => {
    if (!ref.current) return;
    isDown.current = true;
    isDragging.current = false;
    
    if (direction === 'horizontal') {
      startPos.current = e.pageX - ref.current.offsetLeft;
      scrollStart.current = ref.current.scrollLeft;
    } else {
      startPos.current = e.pageY - ref.current.offsetTop;
      scrollStart.current = ref.current.scrollTop;
    }
  };

  // 當滑鼠離開容器範圍時
  const onMouseLeave = () => {
    isDown.current = false;
    isDragging.current = false;
  };

  // 當滑鼠放開時
  const onMouseUp = () => {
    isDown.current = false;
  };

  // 當滑鼠移動時 (核心邏輯)
  const onMouseMove = (e: MouseEvent) => {
    if (!isDown.current || !ref.current) return;
    e.preventDefault(); // 防止選取文字
    
    if (direction === 'horizontal') {
      const x = e.pageX - ref.current.offsetLeft;
      const walk = (x - startPos.current) * 2; // *2 是為了加速捲動感，讓操作更靈敏
      ref.current.scrollLeft = scrollStart.current - walk;
      
      // 若移動距離超過 5px，則視為拖曳行為 (防止誤觸點擊事件)
      if (Math.abs(x - startPos.current) > 5) isDragging.current = true;
    } else {
      const y = e.pageY - ref.current.offsetTop;
      const walk = (y - startPos.current) * 2; 
      ref.current.scrollTop = scrollStart.current - walk;
      if (Math.abs(y - startPos.current) > 5) isDragging.current = true;
    }
  };

  // 輔助函式：用於包覆 onClick 事件
  // 只有在「非拖曳」狀態下才觸發點擊，避免拖曳結束時誤觸按鈕
  const onEntryClick = (callback: () => void) => {
    if (!isDragging.current) {
      callback();
    }
  };

  // 根據方向決定 CSS cursor 樣式
  const cursorClass = direction === 'horizontal' 
    ? "cursor-grab active:cursor-grabbing touch-pan-x" 
    : "cursor-grab active:cursor-grabbing touch-pan-y";

  return { 
    ref, 
    events: { onMouseDown, onMouseLeave, onMouseUp, onMouseMove }, 
    onEntryClick,
    className: `${cursorClass} select-none no-scrollbar` 
  };
};
