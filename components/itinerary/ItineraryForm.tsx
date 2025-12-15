
import React, { useState, useEffect } from 'react';
import { ItineraryItem, Category, CATEGORIES, DATES } from '../../types';
import { Icons } from '../Icon';
import { useImageUpload } from '../../hooks/useImageUpload';
import { parseCoordinatesFromUrl, searchLocationByName } from '../../services/geoUtils';
import { Modal } from '../common/Modal';

interface Props {
  mode: 'add' | 'edit' | 'closed';
  initialData: Partial<ItineraryItem>;
  isTodo: boolean; // 是否為 Day 0 (待辦清單模式)
  onClose: () => void;
  onSave: (data: Partial<ItineraryItem>) => Promise<void>;
}

/**
 * 行程/待辦事項表單 (ItineraryForm)
 * 
 * 邏輯分支：
 * - 若 isTodo 為 true (Day 0)：隱藏日期、時間選擇，僅保留基本欄位。
 * - 若 isTodo 為 false (Day 1-8)：顯示完整的日期、時間、分類選擇。
 * 
 * 地理定位邏輯：
 * - 提交前會嘗試解析 Maps URL 或搜尋地點名稱，將經緯度寫入資料庫，
 *   以便在地圖模式下顯示。
 */
export const ItineraryForm: React.FC<Props> = ({ mode, initialData, isTodo, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<ItineraryItem>>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 重置表單狀態
  useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  const { fileInputRef, handleImageUpload, triggerUpload, handlePaste, handleClipboardRead } = useImageUpload();

  // 監聽貼上事件 (僅在 Modal 開啟時)
  useEffect(() => {
    if (mode === 'closed') return;
    const onPaste = (e: ClipboardEvent) => {
      handlePaste(e, (base64) => setForm(prev => ({ ...prev, imageUrl: base64 })));
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [mode, handlePaste]);

  const handleSubmit = async () => {
    if (!form.location) return;
    setIsSubmitting(true);

    let lat = form.lat;
    let lng = form.lng;
    
    // 1. 嘗試從 URL 解析座標
    if (form.mapsUrl) {
        const coords = parseCoordinatesFromUrl(form.mapsUrl);
        if (coords) { lat = coords.lat; lng = coords.lng; }
    }

    // 2. Fallback: 線上搜尋名稱 (僅在有網路時)
    if ((!lat || !lng) && form.location) {
         if (navigator.onLine) {
            const searchResult = await searchLocationByName(form.location);
            if (searchResult) { lat = searchResult.lat; lng = searchResult.lng; }
         }
    }

    await onSave({ ...form, lat, lng });
    setIsSubmitting(false);
  };

  return (
    <Modal
        isOpen={mode !== 'closed'}
        onClose={onClose}
        title={mode === 'add' ? (isTodo ? '待辦事項' : '行程追加') : '編輯行程'}
        onConfirm={handleSubmit}
        isSubmitting={isSubmitting}
        confirmDisabled={!form.location}
      >
        {/* 圖片上傳區 */}
        <div className="relative w-full mb-4">
            <div 
              onClick={triggerUpload} 
              className="w-full h-32 rounded-xl bg-stone-50 border border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:bg-stone-100 overflow-hidden relative group active-bounce transition-transform"
            >
                {form.imageUrl ? (
                    <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center text-stone-400"><Icons.Plus /><span className="text-[10px] mt-1 font-bold">上傳照片 (可直接貼上)</span></div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => handleImageUpload(e, (base64) => setForm({...form, imageUrl: base64}))} 
                  accept="image/*,image/heic,image/heif" 
                  hidden 
                />
            </div>
            {/* 手機版貼上按鈕 */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    handleClipboardRead((base64) => setForm({...form, imageUrl: base64}));
                }}
                className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-wafu-indigo text-[10px] px-2 py-1.5 rounded-lg shadow-sm border border-stone-200 font-bold hover:bg-white active:scale-95 flex items-center gap-1 z-20 transition-all"
            >
                <span>📋</span>
                <span>貼上</span>
            </button>
        </div>

        {/* 日期選擇 (僅非 Todo 模式顯示) */}
        {!isTodo && (
            <div className="mb-4">
                <label className="text-[10px] text-stone-400 font-bold block mb-1.5 uppercase">日期</label>
                <select 
                    value={form.day} 
                    onChange={e => setForm({...form, day: parseInt(e.target.value)})} 
                    className="w-full p-2 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-sm font-sans"
                >
                    <option value={0}>行前準備</option>
                    {DATES.map((date, idx) => (
                        <option key={idx} value={idx + 1}>
                            Day {idx + 1} - {date}
                        </option>
                    ))}
                </select>
            </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-4">
            {!isTodo && (
            <div className="col-span-1">
                <label className="text-[10px] text-stone-400 font-bold block mb-1.5 uppercase">時間</label>
                <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full p-2 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-sm font-serif" />
            </div>
            )}
            <div className={!isTodo ? "col-span-2" : "col-span-3"}>
                <label className="text-[10px] text-stone-400 font-bold block mb-1.5 uppercase">分類</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value as Category})} className="w-full p-2 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-sm appearance-none font-sans">
                {Object.entries(CATEGORIES).map(([key, val]) => (
                    <option key={key} value={key}>{val.icon} {val.label}</option>
                ))}
                </select>
            </div>
        </div>
        
        <div className="mb-4 space-y-3">
            <input type="text" placeholder={isTodo ? "事項名稱..." : "地點名稱..."} value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo font-bold text-base placeholder:font-normal placeholder:text-stone-300 font-serif" />
            {!isTodo && (
                <div className="relative">
                <input type="text" placeholder="Google Map 連結 (或留空自動搜尋)..." value={form.mapsUrl} onChange={e => setForm({...form, mapsUrl: e.target.value})} className="w-full p-2 pl-8 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-xs text-stone-600" />
                <div className="absolute left-2 top-2.5 text-stone-400"><Icons.MapLink /></div>
                </div>
            )}
        </div>
        <textarea placeholder="備註..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full p-3 mb-2 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo h-20 resize-none text-sm" />
    </Modal>
  );
};
