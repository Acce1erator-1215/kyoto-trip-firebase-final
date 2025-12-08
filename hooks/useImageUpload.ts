
import { useRef, useCallback } from 'react';
import { resizeImage } from '../services/imageUtils';

interface UseImageUploadResult {
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, onSuccess: (base64: string) => void) => Promise<void>;
  triggerUpload: () => void;
  handlePaste: (e: ClipboardEvent, onSuccess: (base64: string) => void) => Promise<void>;
  handleClipboardRead: (onSuccess: (base64: string) => void) => Promise<void>;
}

/**
 * 自訂 Hook: useImageUpload
 * 封裝圖片上傳、壓縮與 Ref 操作邏輯
 * 新增：支援剪貼簿貼上 (Paste) 與 主動讀取 (Clipboard Read)
 */
export const useImageUpload = (): UseImageUploadResult => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    onSuccess: (base64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resizedImage = await resizeImage(file);
        onSuccess(resizedImage);
      } catch (error) {
        console.error("Image upload failed", error);
        alert("圖片處理失敗，請重試");
      }
    }
  };

  const handlePaste = useCallback(async (
    e: ClipboardEvent,
    onSuccess: (base64: string) => void
  ) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          try {
            const resizedImage = await resizeImage(file);
            onSuccess(resizedImage);
            e.preventDefault(); // 阻止預設貼上行為
          } catch (error) {
            console.error("Paste image failed", error);
          }
        }
        break; // 只處理第一張圖片
      }
    }
  }, []);

  // 手機版按鈕觸發：主動讀取剪貼簿
  const handleClipboardRead = async (onSuccess: (base64: string) => void) => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        alert("您的瀏覽器不支援讀取剪貼簿圖片，請直接使用上傳功能。");
        return;
      }

      const clipboardItems = await navigator.clipboard.read();
      let imageFound = false;

      for (const item of clipboardItems) {
        // 尋找圖片類型的項目
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
            imageFound = true;
            const blob = await item.getType(imageType);
            const file = new File([blob], "clipboard_image", { type: imageType });
            const resizedImage = await resizeImage(file);
            onSuccess(resizedImage);
            break; 
        }
      }

      if (!imageFound) {
        alert("剪貼簿中沒有發現圖片。請先複製圖片再試一次。");
      }

    } catch (err) {
      console.error("Clipboard read failed:", err);
      alert("無法讀取剪貼簿。請確認您已授予權限，或該功能在目前環境下無法使用。");
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return { fileInputRef, handleImageUpload, triggerUpload, handlePaste, handleClipboardRead };
};
