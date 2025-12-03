import React, { useState, useRef } from 'react';
import { Restaurant } from '../types';
import { Icons } from './Icon';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { resizeImage } from '../services/imageUtils';
import { calculateDistance, formatDistance, parseCoordinatesFromUrl, searchLocationByName } from '../services/geoUtils';

interface Props {
  items: Restaurant[];
  setItems: any; // Legacy
  userLocation?: { lat: number, lng: number } | null;
  onFocus?: (lat: number, lng: number) => void;
}

const PREDEFINED_TAGS = ['拉麵', '甜點', '咖哩', '燒肉', '火鍋', '大阪燒', '壽司', '咖啡'];

export const FoodList: React.FC<Props> = ({ items, userLocation, onFocus }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Multi-select state
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  
  const [customTagInput, setCustomTagInput] = useState('');
  
  const [form, setForm] = useState<Partial<Restaurant>>({
    name: '',
    description: '',
    rating: 3.0,
    imageUrl: '',
    mapsUrl: '',
    tags: [],
    lat: undefined,
    lng: undefined
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag Scroll Logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const isDrag = useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    isDown.current = true;
    isDrag.current = false;
    if (scrollRef.current) {
      startX.current = e.pageX - scrollRef.current.offsetLeft;
      scrollLeftStart.current = scrollRef.current.scrollLeft;
    }
  };
  
  const onMouseLeave = () => {
    isDown.current = false;
  };
  
  const onMouseUp = () => {
    isDown.current = false;
  };
  
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
    if (Math.abs(x - startX.current) > 5) isDrag.current = true;
  };

  const handleTagClick = (tag: string) => {
      if (!isDrag.current) {
          toggleFilter(tag);
      }
  };

  const handleClearClick = () => {
      if (!isDrag.current) {
          clearFilters();
      }
  };

  const allUsedTags = Array.from(new Set([
      ...PREDEFINED_TAGS,
      ...items.flatMap(i => i.tags || [])
  ]));

  const activeItems = items.filter(i => !i.deleted);
  const deletedItems = items.filter(i => i.deleted);

  // Filter logic: Show items that have AT LEAST ONE of the selected tags (OR logic)
  // If no tags selected, show all
  const filteredItems = activeTagFilters.length === 0 
    ? activeItems 
    : activeItems.filter(i => i.tags?.some(tag => activeTagFilters.includes(tag)));

  const toggleFilter = (tag: string) => {
    if (activeTagFilters.includes(tag)) {
        setActiveTagFilters(activeTagFilters.filter(t => t !== tag));
    } else {
        setActiveTagFilters([...activeTagFilters, tag]);
    }
  };

  const clearFilters = () => {
      setActiveTagFilters([]);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', description: '', rating: 3.0, imageUrl: '', mapsUrl: '', tags: [], lat: undefined, lng: undefined });
    setCustomTagInput('');
    setIsAdding(true);
  };

  const openEdit = (item: Restaurant, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(item.id);
    setForm({ ...item, tags: item.tags || [] });
    setCustomTagInput('');
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
            const cleanData = JSON.parse(JSON.stringify(finalData));
            await updateDoc(doc(db, 'restaurants', editingId), cleanData);
        } else {
            const newId = Date.now().toString();
            const item = {
                id: newId,
                name: form.name,
                description: form.description || '',
                rating: form.rating || 3.0,
                imageUrl: form.imageUrl || '', // No auto image
                mapsUrl: form.mapsUrl || '',
                tags: form.tags || [],
                lat,
                lng,
                deleted: false
            };
            const cleanItem = JSON.parse(JSON.stringify(item));
            await setDoc(doc(db, 'restaurants', newId), cleanItem);
        }
        setIsAdding(false);
    } catch (err) {
        console.error("Error saving restaurant:", err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateDoc(doc(db, 'restaurants', id), { deleted: true });
  };

  const handleRestore = async (id: string) => {
    await updateDoc(doc(db, 'restaurants', id), { deleted: false });
  };

  const handlePermanentDelete = async (id: string) => {
    await deleteDoc(doc(db, 'restaurants', id));
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

  return (
    <div className="pb-40 px-5">
      <div className="mb-4 border-b border-wafu-indigo/20 pb-4 mx-1">
        <h2 className="text-3xl font-black font-serif text-wafu-indigo tracking-wide">美食清單</h2>
      </div>

      <div 
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1 cursor-grab active:cursor-grabbing touch-pan-x"
      >
         <button 
            onClick={handleClearClick} 
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${activeTagFilters.length === 0 ? 'bg-wafu-indigo text-white border-wafu-indigo' : 'bg-white text-stone-400 border-stone-200'}`}
         >
            全部 ({activeItems.length})
         </button>
         {allUsedTags.map(tag => (
             <button 
                key={tag} 
                onClick={() => handleTagClick(tag)} 
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${activeTagFilters.includes(tag) ? 'bg-wafu-gold text-white border-wafu-gold shadow-sm' : 'bg-white text-stone-400 border-stone-200'}`}
             >
                {tag}
             </button>
         ))}
      </div>

      <div className="space-y-6">
        {filteredItems.map(item => {
           const distanceStr = (userLocation && item.lat && item.lng && item.mapsUrl) 
              ? formatDistance(calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng))
              : null;
           
           const hasMap = item.lat && item.lng && item.mapsUrl;

           return (
           <div 
             key={item.id} 
             onClick={() => hasMap && onFocus && onFocus(item.lat!, item.lng!)}
             className={`bg-white rounded-2xl shadow-washi border border-stone-100 overflow-hidden flex flex-col sm:flex-row group transition-all hover:shadow-luxury relative active:scale-[0.99] duration-200 animate-zoom-in ${hasMap ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
           >
              <div className="sm:w-32 h-40 sm:h-auto relative bg-stone-50">
                 {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-300">
                        <Icons.Utensils className="w-8 h-8 mb-1" strokeWidth={1.5} />
                        <span className="text-[10px] font-bold">無照片</span>
                    </div>
                 )}
                 <div className="absolute top-2 left-2 bg-white/90 backdrop-blur rounded px-2 py-0.5 text-xs font-bold text-wafu-gold shadow-sm flex items-center gap-1">
                    <Icons.Star filled /> {item.rating.toFixed(1)}
                 </div>
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
                    <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                        {distanceStr && (
                            <span className="text-[9px] bg-wafu-indigo/10 text-wafu-indigo px-2 py-0.5 rounded font-bold font-mono">
                                📍 {distanceStr}
                            </span>
                        )}
                        {item.tags?.map(tag => (
                            <span key={tag} className="text-[9px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded font-bold">{tag}</span>
                        ))}
                    </div>
                    <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed">{item.description}</p>
                 </div>
              </div>
           </div>
        )})}

        <button onClick={openAdd} className="w-full py-4 border border-dashed border-wafu-indigo/20 rounded-2xl text-wafu-indigo/60 flex items-center justify-center gap-2 hover:bg-white hover:border-wafu-indigo/50 hover:text-wafu-indigo transition-all duration-100 active-bounce font-bold tracking-widest bg-white/40 font-serif">
          <Icons.Plus /> 新增餐廳
        </button>

        {deletedItems.length > 0 && (
          <div className="mt-8 px-2">
             <button onClick={() => setShowTrash(!showTrash)} className="flex items-center gap-2 text-stone-400 hover:text-wafu-indigo text-xs font-bold uppercase tracking-wider mb-3 transition-colors active-bounce">
                <Icons.Trash /><span>已刪除餐廳 ({deletedItems.length})</span>
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
        <div className="fixed inset-0 bg-wafu-darkIndigo/60 backdrop-blur-sm z-[9999] flex items-start justify-center pt-20 px-4 animate-fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-2xl shadow-2xl animate-modal-slide-up relative max-h-[85dvh] flex flex-col overflow-hidden">
             <div className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-wafu-indigo bg-wafu-indigo z-20">
                 <button onClick={() => setIsAdding(false)} className="text-white/80 font-bold text-base hover:text-white transition-colors active-bounce px-2">取消</button>
                 <h3 className="text-lg font-bold font-serif text-white tracking-widest">{editingId ? '編輯餐廳' : '新增餐廳'}</h3>
                 <button onClick={handleSave} disabled={!form.name || isSubmitting} className="bg-white text-wafu-indigo text-sm px-4 py-1.5 rounded-lg font-bold shadow-sm hover:bg-stone-100 disabled:opacity-50 disabled:shadow-none transition-all active-bounce flex items-center gap-2">
                    {isSubmitting ? '...' : '儲存'}
                 </button>
             </div>
             
             <div className="flex-1 overflow-y-auto px-6 py-6 pb-10 relative bg-white">
                <div className="absolute inset-0 bg-wafu-paper opacity-50 pointer-events-none"></div>
                <div className="relative z-10">
                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-32 mb-6 rounded-xl bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:bg-stone-100 overflow-hidden relative active-bounce transition-transform">
                        {form.imageUrl ? (
                            <img src={form.imageUrl} className="w-full h-full object-cover" alt="preview" />
                        ) : (
                            <div className="flex flex-col items-center text-stone-400"><Icons.Plus /><span className="text-[10px] mt-1 font-bold">餐廳照片</span></div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*,image/heic,image/heif" hidden />
                    </div>

                    <div className="space-y-6">
                        <input className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-lg font-bold font-serif" placeholder="餐廳名稱" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        <div>
                            <label className="text-xs text-stone-400 font-bold uppercase mb-2 block">標籤</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {PREDEFINED_TAGS.map(tag => (
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
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};