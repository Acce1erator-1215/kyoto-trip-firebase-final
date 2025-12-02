
import React, { useState, useRef } from 'react';
import { SightseeingSpot } from '../types';
import { Icons } from './Icon';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { resizeImage } from '../services/imageUtils';
import { calculateDistance, formatDistance, parseCoordinatesFromUrl } from '../services/geoUtils';

interface Props {
  items: SightseeingSpot[];
  setItems: any; // Legacy
  userLocation?: { lat: number, lng: number } | null;
  onFocus?: (lat: number, lng: number) => void;
}

export const SightseeingList: React.FC<Props> = ({ items, userLocation, onFocus }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState<Partial<SightseeingSpot>>({
    name: '',
    description: '',
    imageUrl: '',
    mapsUrl: '',
    lat: undefined,
    lng: undefined
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeItems = items.filter(i => !i.deleted);
  const deletedItems = items.filter(i => i.deleted);

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

  const handleSave = () => {
    if (!form.name) return;
    
    setIsAdding(false);

    let lat = form.lat;
    let lng = form.lng;
    if (form.mapsUrl && (!lat || !lng)) {
        const coords = parseCoordinatesFromUrl(form.mapsUrl);
        if (coords) {
            lat = coords.lat;
            lng = coords.lng;
        }
    }

    const finalData = { ...form, lat, lng };

    (async () => {
        try {
            if (editingId) {
                const cleanData = JSON.parse(JSON.stringify(finalData));
                await updateDoc(doc(db, 'sightseeing', editingId), cleanData);
            } else {
                const newId = Date.now().toString();
                const item = {
                    id: newId,
                    name: form.name,
                    description: form.description || '',
                    imageUrl: form.imageUrl || `https://picsum.photos/300/200?sight=${newId}`,
                    mapsUrl: form.mapsUrl || '',
                    lat,
                    lng,
                    deleted: false
                };
                const cleanItem = JSON.parse(JSON.stringify(item));
                await setDoc(doc(db, 'sightseeing', newId), cleanItem);
            }
        } catch (err) {
            console.error("Error saving spot:", err);
        }
    })();
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resizedImage = await resizeImage(file);
        setForm({ ...form, imageUrl: resizedImage });
      } catch (error) {
        console.error("Image upload failed", error);
        alert("圖片處理失敗，請重試");
      }
    }
  };

  return (
    <div className="pb-40 px-5">
      <div className="mb-8 border-b border-wafu-indigo/20 pb-4 mx-1">
        <h2 className="text-3xl font-black font-serif text-wafu-indigo tracking-wide">景點清單</h2>
      </div>

      <div className="space-y-6">
        {activeItems.map(item => {
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
              <div className="sm:w-32 h-40 sm:h-auto relative">
                 <img src={item.imageUrl || `https://picsum.photos/300/200?sight=${item.id}`} alt={item.name} className="w-full h-full object-cover" />
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

      {isAdding && (
        <div className="fixed inset-0 bg-wafu-darkIndigo/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl animate-modal-slide-up relative max-h-[85dvh] flex flex-col overflow-hidden">
             <div className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-wafu-indigo bg-wafu-indigo rounded-t-2xl shadow-md z-20">
                 <button onClick={() => setIsAdding(false)} className="text-white/80 font-bold text-sm hover:text-white transition-colors active-bounce px-2">取消</button>
                 <h3 className="text-lg font-bold font-serif text-white tracking-widest">{editingId ? '編輯景點' : '新增景點'}</h3>
                 <button onClick={handleSave} disabled={!form.name} className="bg-white text-wafu-indigo text-sm px-4 py-1.5 rounded-lg font-bold shadow-sm hover:bg-stone-100 disabled:opacity-50 disabled:shadow-none transition-all active-bounce flex items-center gap-2">儲存</button>
             </div>
             
             <div className="flex-1 overflow-y-auto px-8 py-8 pb-32 relative bg-white">
                <div className="absolute inset-0 bg-wafu-paper opacity-50 pointer-events-none"></div>
                <div className="relative z-10">
                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-32 mb-6 rounded-xl bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:bg-stone-100 overflow-hidden relative active-bounce transition-transform">
                        {form.imageUrl ? (
                            <img src={form.imageUrl} className="w-full h-full object-cover" alt="preview" />
                        ) : (
                            <div className="flex flex-col items-center text-stone-400"><Icons.Plus /><span className="text-[10px] mt-1 font-bold">景點照片</span></div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*,image/heic,image/heif" hidden />
                    </div>

                    <div className="space-y-4">
                        <input className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-lg font-bold font-serif" placeholder="景點名稱" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        
                        <div className="relative">
                            <input className="w-full p-3 pl-9 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-sm" placeholder="Google Maps 連結" value={form.mapsUrl} onChange={e => setForm({...form, mapsUrl: e.target.value})} />
                            <div className="absolute left-3 top-3.5 text-stone-400"><Icons.MapLink /></div>
                        </div>

                        <textarea className="w-full p-4 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo resize-none h-24 placeholder:text-stone-300 text-sm" placeholder="備註..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
