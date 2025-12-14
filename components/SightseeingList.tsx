
import React, { useState, useEffect, useMemo } from 'react';
import { SightseeingSpot } from '../types';
import { Icons } from './Icon';
import { db, sanitizeData } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { calculateDistance, formatDistance, parseCoordinatesFromUrl, searchLocationByName } from '../services/geoUtils';
import { useImageUpload } from '../hooks/useImageUpload'; // 引入圖片上傳 Hook
import { Modal } from './common/Modal';

interface Props {
  items: SightseeingSpot[];
  userLocation?: { lat: number, lng: number } | null;
  onFocus?: (lat: number, lng: number) => void;
}

export const SightseeingList: React.FC<Props> = ({ items, userLocation, onFocus }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState<Partial<SightseeingSpot>>({
    name: '',
    description: '',
    imageUrl: '',
    mapsUrl: '',
    lat: undefined,
    lng: undefined
  });
  
  // 使用 hook 處理圖片邏輯 (含貼上)
  const { fileInputRef, handleImageUpload, triggerUpload, handlePaste, handleClipboardRead } = useImageUpload();

  // 監聽貼上事件
  useEffect(() => {
    if (!isAdding) return;

    const onPaste = (e: ClipboardEvent) => {
        handlePaste(e, (base64) => setForm(prev => ({ ...prev, imageUrl: base64 })));
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [isAdding, handlePaste]);

  const activeItems = items.filter(i => !i.deleted);
  const deletedItems = items.filter(i => i.deleted);

  // 依距離排序邏輯
  const sortedItems = useMemo(() => {
    if (!userLocation) return activeItems;

    return [...activeItems].sort((a, b) => {
      // 若有座標則計算距離，否則視為無限遠
      const distA = (a.lat && a.lng) ? calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng) : Infinity;
      const distB = (b.lat && b.lng) ? calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng) : Infinity;
      
      // 兩者都有距離：由近到遠
      if (distA !== Infinity && distB !== Infinity) {
        return distA - distB;
      }
      
      // 其中一個有距離：有距離的排前面
      if (distA !== Infinity) return -1;
      if (distB !== Infinity) return 1;

      // 都沒有距離：維持原順序
      return 0;
    });
  }, [activeItems, userLocation]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', description: '', imageUrl: '', mapsUrl: '', lat: undefined, lng: undefined });
    setIsAdding(true);
  };

  const openEdit = (item: SightseeingSpot, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(item.id);
    setForm({ ...item });
    setIsAdding(true);
  };

  const handleSave = async () => {
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

    // 2. Fallback: Search by name
    if ((!lat || !lng) && form.name) {
         console.log("Searching coordinates by name:", form.name);
         const searchResult = await searchLocationByName(form.name);
         if (searchResult) {
             lat = searchResult.lat;
             lng = searchResult.lng;
         }
    }

    const finalData = { ...form, lat, lng };

    try {
        if (editingId) {
            // Strip undefined with sanitizeData
            const cleanData = sanitizeData(finalData);
            await updateDoc(doc(db, 'sightseeing', editingId), cleanData);
        } else {
            const newId = Date.now().toString();
            const item = {
                id: newId,
                name: form.name,
                description: form.description || '',
                imageUrl: form.imageUrl || '', // No auto image
                mapsUrl: form.mapsUrl || '',
                lat,
                lng,
                deleted: false
            };
            // Strip undefined with sanitizeData
            const cleanItem = sanitizeData(item);
            await setDoc(doc(db, 'sightseeing', newId), cleanItem);
        }
        setIsAdding(false);
    } catch (err) {
        console.error("Error saving spot:", err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateDoc(doc(db, 'sightseeing', id), { deleted: true });
  };

  const handleRestore = async (id: string) => {
    await updateDoc(doc(db, 'sightseeing', id), { deleted: false });
  };

  const handlePermanentDelete = async (id: string) => {
    await deleteDoc(doc(db, 'sightseeing', id));
  };

  return (
    <div className="pb-40 px-5">
      <div className="mb-8 border-b border-wafu-indigo/20 pb-4 mx-1">
        <h2 className="text-3xl font-black font-serif text-wafu-indigo tracking-wide">景點清單</h2>
      </div>

      <div className="space-y-6">
        {sortedItems.map(item => {
           const distanceStr = (userLocation && item.lat && item.lng && item.mapsUrl) 
              ? formatDistance(calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng))
              : null;
           
           const hasMap = item.lat && item.lng && item.mapsUrl;

           return (
           <div 
             key={item.id} 
             onClick={() => hasMap && onFocus && onFocus(item.lat!, item.lng!)}
             className={`bg-white rounded-2xl shadow-washi border border-stone-100 overflow-hidden flex flex-col sm:flex-row group transition-all hover:shadow-luxury relative animate-zoom-in ${hasMap ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
           >
              <div className="sm:w-32 h-40 sm:h-auto relative bg-stone-50">
                 {item.imageUrl ? (
                     <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                 ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-stone-300">
                        <Icons.MapPin className="w-8 h-8 mb-1" strokeWidth={1.5} />
                        <span className="text-[10px] font-bold">無照片</span>
                     </div>
                 )}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                 <div>
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-serif font-bold text-wafu-indigo">{item.name}</h3>
                        <div className="flex gap-2">
                            {item.mapsUrl && (
                                <a href={item.mapsUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-stone-400 hover:text-wafu-indigo transition-colors active-bounce p-1">
                                    <Icons.MapLink />
                                </a>
                            )}
                            <button onClick={(e) => openEdit(item, e)} className="text-stone-400 hover:text-wafu-indigo active-bounce p-1">
                                <Icons.Edit />
                            </button>
                            <button onClick={(e) => handleDelete(item.id, e)} className="text-stone-300 hover:text-stone-500 p-1 active-bounce">
                                <Icons.Trash />
                            </button>
                        </div>
                    </div>
                    {distanceStr && (
                        <div className="mt-1 mb-2">
                            <span className="text-[9px] bg-wafu-indigo/10 text-wafu-indigo px-2 py-0.5 rounded font-bold font-mono">
                                📍 {distanceStr}
                            </span>
                        </div>
                    )}
                    <p className="text-sm text-stone-500 mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
                 </div>
              </div>
           </div>
        )})}

        <button onClick={openAdd} className="w-full py-4 border border-dashed border-wafu-indigo/20 rounded-2xl text-wafu-indigo/60 flex items-center justify-center gap-2 hover:bg-white hover:border-wafu-indigo/50 hover:text-wafu-indigo transition-all duration-100 active-bounce font-bold tracking-widest bg-white/40 font-serif">
          <Icons.Plus /> 新增景點
        </button>

        {deletedItems.length > 0 && (
          <div className="mt-8 px-2">
             <button onClick={() => setShowTrash(!showTrash)} className="flex items-center gap-2 text-stone-400 hover:text-wafu-indigo text-xs font-bold uppercase tracking-wider mb-3 transition-colors active-bounce">
                <Icons.Trash /><span>已刪除景點 ({deletedItems.length})</span>
             </button>
             {showTrash && (
               <div className="space-y-3 bg-stone-50/50 p-4 rounded-xl border border-stone-100">
                  {deletedItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center opacity-60 hover:opacity-100 transition-opacity gap-2">
                       <span className="text-sm text-stone-500 font-serif truncate flex-1">{item.name}</span>
                       <div className="flex gap-1 shrink-0">
                           <button onClick={() => handleRestore(item.id)} className="text-xs bg-stone-200 hover:bg-wafu-indigo hover:text-white px-2 py-1 rounded-md transition-colors font-bold active-bounce">復原</button>
                           <button onClick={() => handlePermanentDelete(item.id)} className="text-xs bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-500 px-2 py-1 rounded-md transition-colors font-bold active-bounce">永久刪除</button>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title={editingId ? '編輯景點' : '新增景點'}
        onConfirm={handleSave}
        isSubmitting={isSubmitting}
        confirmDisabled={!form.name || isSubmitting}
      >
        <div className="relative w-full mb-6">
            <div onClick={triggerUpload} className="w-full h-32 rounded-xl bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:bg-stone-100 overflow-hidden relative active-bounce transition-transform">
                {form.imageUrl ? (
                    <img src={form.imageUrl} className="w-full h-full object-cover" alt="preview" />
                ) : (
                    <div className="flex flex-col items-center text-stone-400"><Icons.Plus /><span className="text-[10px] mt-1 font-bold">景點照片 (可直接貼上)</span></div>
                )}
                <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, (base64) => setForm({...form, imageUrl: base64}))} accept="image/*,image/heic,image/heif" hidden />
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

        <div className="space-y-4">
            <input className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-lg font-bold font-serif" placeholder="景點名稱" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            
            <div className="relative">
                <input className="w-full p-3 pl-9 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-sm" placeholder="Google Maps 連結 (或留空自動搜尋)..." value={form.mapsUrl} onChange={e => setForm({...form, mapsUrl: e.target.value})} />
                <div className="absolute left-3 top-3.5 text-stone-400"><Icons.MapLink /></div>
            </div>

            <textarea className="w-full p-4 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo resize-none h-24 placeholder:text-stone-300 text-sm" placeholder="備註..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        </div>
      </Modal>
    </div>
  );
};
