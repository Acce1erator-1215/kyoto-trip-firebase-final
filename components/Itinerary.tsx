
import React, { useState, useEffect, useCallback } from 'react';
import { ItineraryItem, Category, CATEGORIES, DATES } from '../types';
import { Icons } from './Icon';
import { db, sanitizeData } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { calculateDistance, formatDistance, parseCoordinatesFromUrl, searchLocationByName } from '../services/geoUtils';
import { Modal } from './common/Modal'; // 引入通用組件
import { useImageUpload } from '../hooks/useImageUpload'; // 引入通用 Hook

interface ItineraryProps {
  dayIndex: number;      
  items: ItineraryItem[]; 
  deletedItems?: ItineraryItem[]; 
  isTodo?: boolean;      
  userLocation?: { lat: number, lng: number } | null; 
  onFocus?: (lat: number, lng: number) => void;       
}

export const Itinerary: React.FC<ItineraryProps> = ({ dayIndex, items, deletedItems = [], isTodo, userLocation, onFocus }) => {
  // 模態框狀態
  const [modalMode, setModalMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  
  // 表單狀態
  const [itemForm, setItemForm] = useState<Partial<ItineraryItem>>({
    day: dayIndex, // 預設為當前天數
    category: 'sightseeing',
    time: isTodo ? '' : '09:00',
    location: '',
    notes: '',
    imageUrl: '',
    mapsUrl: '',
    lat: undefined,
    lng: undefined
  });

  // 圖片上傳 Hook (解構 handlePaste, handleClipboardRead)
  const { fileInputRef, handleImageUpload, triggerUpload, handlePaste, handleClipboardRead } = useImageUpload();

  // 監聽貼上事件
  useEffect(() => {
    if (modalMode === 'closed') return;

    const onPaste = (e: ClipboardEvent) => {
        handlePaste(e, (base64) => setItemForm(prev => ({ ...prev, imageUrl: base64 })));
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [modalMode, handlePaste]);

  // 天氣資訊狀態
  const [weather, setWeather] = useState<{ temp: number; code: number; location: string } | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // --- 天氣邏輯區塊 ---
  const fetchWeather = useCallback(async () => {
      if (dayIndex === 0) {
          setWeather(null);
          return;
      }

      // 網路檢查：如果離線，不執行 fetch
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
          return;
      }
      
      setIsWeatherLoading(true);

      const getLocationForDay = (day: number) => {
          if (day === 1) return { lat: 34.6901, lng: 135.1955, name: '神戶' }; 
          if (day === 2) return { lat: 34.8151, lng: 134.6853, name: '姬路/神戶' }; 
          return { lat: 35.0116, lng: 135.7681, name: '京都' }; 
      };

      const target = getLocationForDay(dayIndex);
      try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${target.lat}&longitude=${target.lng}&current=temperature_2m,weather_code&timezone=Asia%2FTokyo`);
          if (!res.ok) throw new Error('Network response was not ok');
          const data = await res.json();
          if (data.current) {
              setWeather({
                  temp: Math.round(data.current.temperature_2m),
                  code: data.current.weather_code,
                  location: target.name
              });
          }
      } catch (e) {
          setWeather(null);
      } finally {
          setIsWeatherLoading(false);
      }
  }, [dayIndex]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const getWeatherIcon = (code: number) => {
      if (code <= 1) return <Icons.Sun className="w-4 h-4 text-orange-400" filled />;
      if (code <= 3) return <Icons.Cloud className="w-4 h-4 text-stone-400" />;
      if (code <= 48) return <Icons.Cloud className="w-4 h-4 text-stone-400" />;
      if (code <= 67) return <Icons.CloudRain className="w-4 h-4 text-blue-400" />;
      if (code >= 71) return <Icons.Snow className="w-4 h-4 text-sky-300" />;
      return <Icons.CloudSun className="w-4 h-4 text-stone-400" />;
  };

  // --- CRUD 邏輯 ---
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await updateDoc(doc(db, 'itinerary', id), { deleted: true }); } 
    catch (err) { console.error("Error deleting:", err); }
  };

  const handleRestore = async (id: string) => {
    try { await updateDoc(doc(db, 'itinerary', id), { deleted: false }); } 
    catch (err) { console.error("Error restoring:", err); }
  };

  const handlePermanentDelete = async (id: string) => {
    try { await deleteDoc(doc(db, 'itinerary', id)); } 
    catch (err) { console.error("Error permanent deleting:", err); }
  };

  const handleEditClick = (item: ItineraryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemForm({ ...item });
    setModalMode('edit');
  };

  const handleOpenAdd = () => {
    setItemForm({ 
        day: dayIndex, // 新增時預設為當前分頁的天數
        category: 'sightseeing', 
        time: isTodo ? '' : '09:00', 
        location: '', 
        notes: '',
        imageUrl: '',
        mapsUrl: '',
        lat: undefined,
        lng: undefined
    });
    setModalMode('add');
  };

  const handleSubmit = async () => {
    if (!itemForm.location) return;
    setIsSubmitting(true);

    let lat = itemForm.lat;
    let lng = itemForm.lng;
    
    // 嘗試從 URL 解析座標
    if (itemForm.mapsUrl) {
        const coords = parseCoordinatesFromUrl(itemForm.mapsUrl);
        if (coords) { lat = coords.lat; lng = coords.lng; }
    }

    // 若無座標則嘗試依名稱搜尋 (需有網路)
    if ((!lat || !lng) && itemForm.location) {
         if (navigator.onLine) {
            const searchResult = await searchLocationByName(itemForm.location);
            if (searchResult) { lat = searchResult.lat; lng = searchResult.lng; }
         }
    }

    // 確保 day 是數字
    const finalData = { 
        ...itemForm, 
        day: Number(itemForm.day), 
        lat, 
        lng 
    };

    try {
      if (modalMode === 'edit' && itemForm.id) {
          await updateDoc(doc(db, 'itinerary', itemForm.id), sanitizeData(finalData));
      } else {
          const newItemId = Date.now().toString();
          const item: ItineraryItem = {
              id: newItemId,
              day: Number(itemForm.day) || dayIndex,
              time: itemForm.time || '',
              location: itemForm.location || '',
              category: itemForm.category as Category,
              notes: itemForm.notes || '',
              completed: false,
              imageUrl: itemForm.imageUrl || '',
              mapsUrl: itemForm.mapsUrl || '',
              lat,
              lng,
              deleted: false
          };
          await setDoc(doc(db, 'itinerary', newItemId), sanitizeData(item));
      }
      setModalMode('closed');
    } catch (err) {
      console.error("Error saving itinerary:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'itinerary', id), { completed: !currentStatus });
  };

  const dayDate = dayIndex > 0 ? DATES[dayIndex - 1] : '';

  return (
    <div className="pb-40"> 
      {/* 標題區塊 */}
      <div className="mb-6 px-6">
        <div className="flex justify-between items-start border-b border-wafu-indigo/10 pb-4">
          <div>
            <h2 className="text-3xl font-black font-serif text-wafu-indigo tracking-tight mb-2">
              {isTodo ? "行前準備" : `Day ${dayIndex}`}
            </h2>
            {!isTodo && weather && (
              <div 
                className="flex items-center gap-2 text-sm text-wafu-text font-bold opacity-80 animate-fade-in cursor-pointer group"
                onClick={fetchWeather}
              >
                 {getWeatherIcon(weather.code)}
                 <span>{weather.location} {weather.temp}°C</span>
                 <Icons.Refresh className={`w-3 h-3 text-stone-400 group-hover:text-wafu-indigo transition-colors ${isWeatherLoading ? 'animate-spin' : ''}`} />
              </div>
            )}
            {!isTodo && !weather && (
               <button 
                  onClick={fetchWeather}
                  className="flex items-center gap-1 text-xs text-stone-400 font-bold bg-stone-100 px-2 py-1 rounded-md mt-1 hover:bg-stone-200"
               >
                   <Icons.Refresh className={`w-3 h-3 ${isWeatherLoading ? 'animate-spin' : ''}`} />
                   <span>獲取天氣</span>
               </button>
            )}
          </div>
          
          {!isTodo && (
            <div className="writing-vertical text-right h-20 text-xs font-serif font-bold text-wafu-gold tracking-widest border-l border-wafu-indigo/20 pl-3 mt-[-0.5rem] z-0">
              {dayDate.replace(/-/g, '.')}
            </div>
          )}
        </div>
      </div>

      {/* 行程列表 */}
      <div className="space-y-6 px-3 sm:px-5 relative z-10">
        {!isTodo && items.length > 0 && (
           <div className="absolute left-[3.5rem] top-4 bottom-8 w-0.5 bg-gradient-to-b from-wafu-gold via-wafu-goldLight to-transparent z-0 opacity-50"></div>
        )}

        {items.map((item, index) => {
          const distanceStr = (userLocation && item.lat && item.lng && item.mapsUrl) 
            ? formatDistance(calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng))
            : null;
          const hasMap = item.lat && item.lng && item.mapsUrl;

          return (
          <div
            key={item.id}
            onClick={() => hasMap && onFocus && onFocus(item.lat!, item.lng!)}
            className={`
              relative group flex items-start gap-3 sm:gap-4 z-10 transition-all duration-300 animate-zoom-in
              ${isTodo && item.completed ? 'opacity-60 grayscale' : ''}
              ${hasMap ? 'cursor-pointer hover:scale-[1.01]' : ''}
            `}
          >
             {!isTodo && (
               <div className="w-14 shrink-0 flex flex-col items-end pt-5 relative">
                 <span className="font-serif font-bold text-wafu-indigo text-base tracking-tighter">{item.time}</span>
                 <div className="w-3 h-3 rounded-full border-2 border-wafu-bg bg-wafu-indigo absolute right-[-1.15rem] top-[1.65rem] z-20 shadow-sm"></div>
               </div>
             )}

             {isTodo && (
                <div className="w-10 shrink-0 flex items-center justify-center pt-5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleComplete(item.id, !!item.completed); }}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-200 active-bounce
                      ${item.completed 
                        ? 'bg-wafu-gold text-white shadow-sm animate-pop' 
                        : 'border-2 border-stone-300 bg-white hover:border-wafu-gold'
                      }
                    `}>
                     {item.completed && <Icons.Check />}
                   </button>
                </div>
             )}

            <div className={`
                flex-1 bg-white rounded-2xl p-5 shadow-washi border border-stone-100 relative overflow-hidden group-hover:shadow-float transition-all active:scale-[0.99]
                ${isTodo && item.completed ? 'border-l-4 border-l-wafu-gold' : ''}
                ${isTodo && !item.completed ? 'border-l-4 border-l-stone-200' : ''}
              `}>
               <div className="absolute inset-0 bg-wafu-paper opacity-80 pointer-events-none"></div>
               {isTodo && item.completed && (
                   <div className="absolute top-2 right-2 z-30 animate-stamp-drop pointer-events-none opacity-80">
                       <Icons.Goshuin className="w-24 h-24 text-red-700/80 mix-blend-multiply transform rotate-12" />
                   </div>
               )}

               {item.imageUrl && (
                   <div className="mb-3 rounded-xl overflow-hidden h-32 w-full relative z-10 border border-stone-100">
                       <img src={item.imageUrl} alt={item.location} className="w-full h-full object-cover" />
                   </div>
               )}

               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex gap-2 items-center">
                      <span className={`text-[10px] px-2 py-0.5 border font-bold tracking-widest uppercase font-serif rounded-md ${CATEGORIES[item.category].color}`}>
                        {CATEGORIES[item.category].label}
                      </span>
                      {distanceStr && (
                          <span className="text-[10px] bg-wafu-indigo/10 text-wafu-indigo px-1.5 py-0.5 rounded font-bold font-mono">
                            {distanceStr}
                          </span>
                      )}
                   </div>
                 </div>
                 
                 <div className="flex justify-between items-start gap-2">
                    <h3 className={`font-serif text-lg font-bold text-wafu-text leading-snug tracking-wide ${isTodo && item.completed ? 'line-through decoration-stone-400 opacity-60' : ''}`}>
                      {item.location}
                    </h3>
                    <div className="flex gap-1">
                        {item.mapsUrl && (
                        <a href={item.mapsUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-wafu-indigo hover:text-wafu-gold transition-colors p-1 active-bounce">
                            <Icons.MapLink />
                        </a>
                        )}
                        <button onClick={(e) => handleEditClick(item, e)} className="p-1 text-stone-400 hover:text-wafu-indigo transition-all duration-100 active-bounce">
                            <Icons.Edit />
                        </button>
                        <button onClick={(e) => handleDelete(item.id, e)} className="p-1 text-stone-400 hover:text-stone-600 transition-all duration-100 active-bounce">
                            <Icons.Trash />
                        </button>
                    </div>
                 </div>
                 {item.notes && <div className="mt-3 pt-2 border-t border-dashed border-stone-200 text-sm text-stone-500 font-sans leading-relaxed">{item.notes}</div>}
               </div>
            </div>
          </div>
        )})}

        {/* 垃圾桶區域 */}
        {deletedItems.length > 0 && (
          <div className="mt-8 px-2">
             <button onClick={() => setShowTrash(!showTrash)} className="flex items-center gap-2 text-stone-400 hover:text-wafu-indigo text-xs font-bold uppercase tracking-wider mb-3 transition-colors active-bounce">
                <Icons.Trash /><span>已刪除項目 ({deletedItems.length})</span>
             </button>
             {showTrash && (
               <div className="space-y-3 bg-stone-50/50 p-4 rounded-xl border border-stone-100">
                  {deletedItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center opacity-60 hover:opacity-100 transition-opacity gap-2">
                       <span className="text-sm text-stone-500 font-serif truncate flex-1">{item.location}</span>
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

      {/* 新增按鈕 */}
      <div className="mt-12 px-6">
          <button onClick={handleOpenAdd} className="w-full py-4 border border-dashed border-wafu-indigo/20 rounded-2xl text-wafu-indigo/60 flex items-center justify-center gap-2 hover:bg-white hover:border-wafu-indigo/50 hover:text-wafu-indigo transition-all duration-100 active-bounce font-bold tracking-widest bg-white/40 font-serif">
            <Icons.Plus />
            {isTodo ? "新增待辦" : "追加行程"}
          </button>
      </div>

      {/* 使用通用 Modal 組件 */}
      <Modal
        isOpen={modalMode !== 'closed'}
        onClose={() => setModalMode('closed')}
        title={modalMode === 'add' ? (isTodo ? '待辦事項' : '行程追加') : '編輯行程'}
        onConfirm={handleSubmit}
        isSubmitting={isSubmitting}
        confirmDisabled={!itemForm.location}
      >
        {/* 圖片上傳區 */}
        <div className="relative w-full mb-4">
            <div 
              onClick={triggerUpload} 
              className="w-full h-32 rounded-xl bg-stone-50 border border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:bg-stone-100 overflow-hidden relative group active-bounce transition-transform"
            >
                {itemForm.imageUrl ? (
                    <img src={itemForm.imageUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center text-stone-400"><Icons.Plus /><span className="text-[10px] mt-1 font-bold">上傳照片 (可直接貼上)</span></div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => handleImageUpload(e, (base64) => setItemForm({...itemForm, imageUrl: base64}))} 
                  accept="image/*,image/heic,image/heif" 
                  hidden 
                />
            </div>
            {/* 手機版貼上按鈕 */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    handleClipboardRead((base64) => setItemForm({...itemForm, imageUrl: base64}));
                }}
                className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-wafu-indigo text-[10px] px-2 py-1.5 rounded-lg shadow-sm border border-stone-200 font-bold hover:bg-white active:scale-95 flex items-center gap-1 z-20 transition-all"
            >
                <span>📋</span>
                <span>貼上</span>
            </button>
        </div>

        {/* 日期選擇器 (UX優化：允許移動行程至別天) */}
        {!isTodo && (
            <div className="mb-4">
                <label className="text-[10px] text-stone-400 font-bold block mb-1.5 uppercase">日期</label>
                <select 
                    value={itemForm.day} 
                    onChange={e => setItemForm({...itemForm, day: parseInt(e.target.value)})} 
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
                <input type="time" value={itemForm.time} onChange={e => setItemForm({...itemForm, time: e.target.value})} className="w-full p-2 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-sm font-serif" />
            </div>
            )}
            <div className={!isTodo ? "col-span-2" : "col-span-3"}>
                <label className="text-[10px] text-stone-400 font-bold block mb-1.5 uppercase">分類</label>
                <select value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value as Category})} className="w-full p-2 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-sm appearance-none font-sans">
                {Object.entries(CATEGORIES).map(([key, val]) => (
                    <option key={key} value={key}>{val.icon} {val.label}</option>
                ))}
                </select>
            </div>
        </div>
        
        <div className="mb-4 space-y-3">
            <input type="text" placeholder={isTodo ? "事項名稱..." : "地點名稱..."} value={itemForm.location} onChange={e => setItemForm({...itemForm, location: e.target.value})} className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo font-bold text-base placeholder:font-normal placeholder:text-stone-300 font-serif" />
            {!isTodo && (
                <div className="relative">
                <input type="text" placeholder="Google Map 連結 (或留空自動搜尋)..." value={itemForm.mapsUrl} onChange={e => setItemForm({...itemForm, mapsUrl: e.target.value})} className="w-full p-2 pl-8 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-xs text-stone-600" />
                <div className="absolute left-2 top-2.5 text-stone-400"><Icons.MapLink /></div>
                </div>
            )}
        </div>
        <textarea placeholder="備註..." value={itemForm.notes} onChange={e => setItemForm({...itemForm, notes: e.target.value})} className="w-full p-3 mb-2 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo h-20 resize-none text-sm" />
      </Modal>
    </div>
  );
};
