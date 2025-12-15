
/**
 * 圖片處理工具
 * 
 * Code Review Notes:
 * 1. 為什麼要前端壓縮?
 *    Firestore 單一文件大小限制為 1MB。若使用者上傳高畫質照片 (5MB+)，直接存 Base64 會導致寫入失敗。
 *    因此需要在前端進行 Canvas 繪製並壓縮，將品質降至 JPEG 0.7 左右，通常可控制在 100KB-300KB。
 * 
 * 2. 為什麼不使用 Firebase Storage?
 *    在這個小型應用中，為了簡化架構 (減少收費請求次數和權限配置)，直接將圖片轉 Base64 存入 Firestore 是一種 Trade-off。
 *    優點：讀取方便、無需額外請求。缺點：增加資料庫體積。
 * 
 * @param file 原始圖片檔案
 * @param maxWidth 最大寬度 (預設 800px)
 * @param quality JPEG 壓縮品質 (0-1，預設 0.7)
 * @returns Promise<string> Base64 格式的圖片字串
 */
export const resizeImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 計算等比例縮放後的尺寸
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }

        elem.width = width;
        elem.height = height;

        const ctx = elem.getContext('2d');
        if (!ctx) {
          reject(new Error('無法建立 Canvas Context'));
          return;
        }

        // 將圖片繪製到 Canvas 上 (瀏覽器會自動處理轉向 Exif Rotation 與格式解碼)
        ctx.drawImage(img, 0, 0, width, height);
        
        // 輸出為 JPEG Base64 字串
        // 指定 image/jpeg 可以獲得比 png 更好的壓縮率
        const dataUrl = elem.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      
      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (err) => reject(err);
  });
};
