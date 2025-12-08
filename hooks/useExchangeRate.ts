import { useState, useEffect } from 'react';

/**
 * 自訂 Hook: useExchangeRate
 * 用途：獲取即時日幣 (JPY) 對台幣 (TWD) 的匯率
 * 
 * @param defaultRate 預設匯率 (當 API 呼叫失敗時使用的備案值，預設 0.22)
 */
export const useExchangeRate = (defaultRate = 0.22) => {
  const [currentRate, setCurrentRate] = useState<number>(defaultRate);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRate = async () => {
      // 網路檢查：如果離線，不執行 fetch
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
          return;
      }
      
      setIsLoading(true);

      try {
          // 使用免費的 exchangerate-api 獲取最新匯率
          const res = await fetch('https://api.exchangerate-api.com/v4/latest/JPY');
          
          // 如果網路回應不正常 (例如 404 或 500)，拋出錯誤以進入 catch 區塊
          if (!res.ok) throw new Error('Network response was not ok');
          
          const data = await res.json();
          
          // 若成功獲取 TWD 匯率則更新
          if (data && data.rates && data.rates.TWD) {
              setCurrentRate(data.rates.TWD);
              setLastUpdated(new Date());
          }
      } catch (e) {
          // 靜默失敗：使用預設值，僅在 debug 模式下記錄
          // console.debug("匯率獲取失敗 (可能離線或被阻擋)，使用預設值:", e);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchRate(); // 初次載入時執行
    
    // 設定每小時 (3600000 ms) 自動更新一次匯率
    const interval = setInterval(fetchRate, 3600000); 
    
    return () => clearInterval(interval);
  }, []);

  return { currentRate, refresh: fetchRate, isLoading, lastUpdated };
};