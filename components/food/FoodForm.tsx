
import React, { useState, useEffect } from 'react';
import { Restaurant } from '../../types';
import { Icons } from '../Icon';
import { Modal } from '../common/Modal';
import { useImageUpload } from '../../hooks/useImageUpload';
import { parseCoordinatesFromUrl, searchLocationByName } from '../../services/geoUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialData: Partial<Restaurant>;
  availableTags: string[];
  onSave: (data: Partial<Restaurant>) => Promise<void>;
}

export const FoodForm: React.FC<Props> = ({ isOpen, onClose, title, initialData, availableTags, onSave }) => {
  const [form, setForm] = useState<Partial<Restaurant>>(initialData);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hook for image logic
  const { fileInputRef, handleImageUpload, triggerUpload, handlePaste, handleClipboardRead } = useImageUpload();

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setForm(initialData);
      setCustomTagInput('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]);

  // Paste listener
  useEffect(() => {
    if (!isOpen) return;
    const onPaste = (e: ClipboardEvent) => {
        handlePaste(e, (base64) => setForm(prev => ({ ...prev, imageUrl: base64 })));
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [isOpen, handlePaste]);

  const toggleTag = (tag: string) => {
      const currentTags = form.tags || [];
      if (currentTags.includes(tag)) {
          setForm({ ...form, tags: currentTags.filter(t => t !== tag) });
      } else {
          setForm({ ...form, tags: [...currentTags, tag] });
      }
  };

  const addCustomTag = () => {
      if (customTagInput && !form.tags?.includes(customTagInput)) {
          setForm({ ...form, tags: [...(form.tags || []), customTagInput] });
          setCustomTagInput('');
      }
  };

  const handleConfirm = async () => {
    if (!form.name) return;
    
    setIsSubmitting(true);

    let lat = form.lat;
    let lng = form.lng;

    // 1. Try URL parse
    if (form.mapsUrl) {
        const coords = parseCoordinatesFromUrl(form.mapsUrl);
        if (coords) {
            lat = coords.lat;
            lng = coords.lng;
        }
    }

    // 2. Fallback: Search by name if coords are missing
    if ((!lat || !lng) && form.name) {
         const searchResult = await searchLocationByName(form.name);
         if (searchResult) {
             lat = searchResult.lat;
             lng = searchResult.lng;
         }
    }

    const finalData = { ...form, lat, lng };
    
    await onSave(finalData);
    setIsSubmitting(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      onConfirm={handleConfirm}
      isSubmitting={isSubmitting}
      confirmDisabled={!form.name || isSubmitting}
    >
      {/* Image Upload Area */}
      <div className="relative w-full mb-6">
          <div onClick={triggerUpload} className="w-full h-32 rounded-xl bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:bg-stone-100 overflow-hidden relative active-bounce transition-transform">
              {form.imageUrl ? (
                  <img src={form.imageUrl} className="w-full h-full object-cover" alt="preview" />
              ) : (
                  <div className="flex flex-col items-center text-stone-400"><Icons.Plus /><span className="text-[10px] mt-1 font-bold">餐廳照片 (可直接貼上)</span></div>
              )}
              <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, (base64) => setForm({...form, imageUrl: base64}))} accept="image/*,image/heic,image/heif" hidden />
          </div>
           {/* Paste Button */}
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

      <div className="space-y-6">
          <input className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-lg font-bold font-serif" placeholder="餐廳名稱" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <div>
              <label className="text-xs text-stone-400 font-bold uppercase mb-2 block">標籤</label>
              <div className="flex flex-wrap gap-2 mb-3">
                  {/* Show available tags for selection */}
                  {availableTags.map(tag => (
                      <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 border ${form.tags?.includes(tag) ? 'bg-wafu-indigo text-white border-wafu-indigo' : 'bg-stone-50 text-stone-400 border-stone-200 hover:border-wafu-indigo/50'}`}>{tag}</button>
                  ))}
              </div>
              <div className="flex gap-2">
                  <input className="flex-1 p-2 bg-stone-50 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-wafu-indigo" placeholder="自訂標籤..." value={customTagInput} onChange={e => setCustomTagInput(e.target.value)} />
                  <button onClick={addCustomTag} className="px-3 py-1 bg-stone-200 text-stone-600 rounded-lg font-bold text-xs">新增</button>
              </div>
          </div>
          
          <div>
               <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-stone-400 font-bold uppercase">評分</label>
                  <span className="text-lg font-bold text-wafu-indigo font-serif flex items-center gap-1 transition-all"><Icons.Star filled /> {typeof form.rating === 'number' ? form.rating.toFixed(1) : '3.0'}</span>
               </div>
               <input type="range" min="1" max="5" step="0.1" value={form.rating} onChange={e => setForm({...form, rating: parseFloat(e.target.value)})} className="range-slider touch-pan-x touch-action-none" />
               <div className="flex justify-between text-[10px] text-stone-400 font-bold mt-1 px-1"><span>1.0</span><span>5.0</span></div>
          </div>

          <div className="relative">
              <input className="w-full p-3 pl-9 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-sm" placeholder="Google Maps 連結 (或留空自動搜尋)..." value={form.mapsUrl} onChange={e => setForm({...form, mapsUrl: e.target.value})} />
              <div className="absolute left-3 top-3.5 text-stone-400"><Icons.MapLink /></div>
          </div>

          <textarea className="w-full p-4 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo resize-none h-24 placeholder:text-stone-300 text-base" placeholder="評價與備註..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
      </div>
    </Modal>
  );
};
