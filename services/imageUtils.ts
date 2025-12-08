
/**
 * 圖片處理工具
 * 主要功能：將使用者上傳的圖片進行 Resize (縮放) 與 Compress (壓縮)
 * 目的：
 * 1. 繞過 Firestore 單一文件 1MB 的大小限制 (將圖片轉為 Base64 字串存入)
 * 2. 統一圖片格式為 JPEG
 * 3. 修正 iOS HEIC/HEIF 格式相容性問題 (瀏覽器 Canvas 會自動處理)
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

        // 將圖片繪製到 Canvas 上 (此時會自動處理轉向與格式解碼)
        ctx.drawImage(img, 0, 0, width, height);
        
        // 輸出為 JPEG Base64 字串
        const dataUrl = elem.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      
      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (err) => reject(err);
  });
};
