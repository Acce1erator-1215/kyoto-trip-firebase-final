
import React, { useState, useEffect, useCallback } from 'react';
import { ItineraryItem, Category, DATES } from '../types';
import { Icons } from './Icon';
import { db, sanitizeData } from '../firebase';
import { useToast } from '../context/ToastContext'; // Import useToast
// Removed v9 modular imports
import { ItineraryItemCard } from './itinerary/ItineraryItemCard';
import { ItineraryForm } from './itinerary/ItineraryForm';

interface ItineraryProps {
  dayIndex: number;      
  items: ItineraryItem[]; 
  deletedItems?: ItineraryItem[]; 
  isTodo?: boolean;      
  userLocation?: { lat: number, lng: number } | null; 
  onFocus?: (lat: number, lng: number) => void;       
}

export const Itinerary: React.FC<ItineraryProps> = ({ dayIndex, items, deletedItems = [], isTodo, userLocation, onFocus }) => {
  const { showToast } = useToast(); // Use Toast Hook
  const [modalMode, setModalMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [showTrash, setShowTrash] = useState(false);
  
  const defaultFormState: Partial<ItineraryItem> = {
    day: dayIndex,
    category: 'sightseeing',
    time: isTodo ? '' : '09:00',
    location: '',
    notes: '',
    imageUrl: '',
    mapsUrl: '',
    lat: undefined,
    lng: undefined
  };
  
  const [itemForm, setItemForm] = useState<Partial<ItineraryItem>>(defaultFormState);
  const [weather, setWeather] = useState<{ temp: number; code: number; location: string } | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // Weather Logic
  const fetchWeather = useCallback(async () => {
      if (dayIndex === 0) { setWeather(null); return; }
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      
      setIsWeatherLoading(true);
      
      let target = { lat: 35.0116, lng: 135.7681, name: '京都' }; 
      if (dayIndex === 1) target = { lat: 34.6901, lng: 135.1955, name: '神戶' }; 
      if (dayIndex === 2) target = { lat: 34.8151, lng: 134.6853, name: '姬路' }; 
      if (dayIndex === 6) target = { lat: 34.7024, lng: 135.4959, name: '大阪' };
      if (dayIndex === 8) target = { lat: 34.4320, lng: 135.2304, name: '關西機場' };

      try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${target.lat}&longitude=${target.lng}&current=temperature_2m,weather_code&timezone=Asia%2FTokyo`);
          if (!res.ok) throw new Error('Network response');
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

  // --- CRUD Operations ---
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { 
        await db.collection('itinerary').doc(id).update({ deleted: true });
        showToast("項目已移至回收桶", "info");
    } 
    catch (err) { 
        console.error("Error deleting:", err);
        showToast("刪除失敗", "error");
    }
  };

  const handleRestore = async (id: string) => {
    try { 
        await db.collection('itinerary').doc(id).update({ deleted: false });
        showToast("項目已復原", "success");
    } 
    catch (err) { 
        console.error("Error restoring:", err);
        showToast("復原失敗", "error");
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try { 
        await db.collection('itinerary').doc(id).delete();
        showToast("項目已永久刪除", "success");
    } 
    catch (err) { 
        console.error("Error permanent deleting:", err);
        showToast("刪除失敗", "error");
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    await db.collection('itinerary').doc(id).update({ completed: !currentStatus });
    if (!currentStatus) showToast("恭喜完成！", "success");
  };

  const handleOpenAdd = () => {
    setItemForm({ ...defaultFormState, day: dayIndex });
    setModalMode('add');
  };

  const handleEditClick = (item: ItineraryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemForm({ ...item });
    setModalMode('edit');
  };

  const handleSave = async (formData: Partial<ItineraryItem>) => {
    const finalData = { 
        ...formData, 
        day: Number(formData.day) 
    };

    try {
      if (modalMode === 'edit' && formData.id) {
          await db.collection('itinerary').doc(formData.id).update(sanitizeData(finalData));
          showToast("行程更新成功", "success");
      } else {
          const newItemId = Date.now().toString();
          const item: ItineraryItem = {
              id: newItemId,
              day: Number(formData.day) || dayIndex,
              time: formData.time || '',
              location: formData.location || '',
              category: formData.category as Category,
              notes: formData.notes || '',
              completed: false,
              imageUrl: formData.imageUrl || '',
              mapsUrl: formData.mapsUrl || '',
              lat: formData.lat,
              lng: formData.lng,
              deleted: false
          };
          await db.collection('itinerary').doc(newItemId).set(sanitizeData(item));
          showToast("行程新增成功", "success");
      }
      setModalMode('closed');
    } catch (err) {
      console.error("Error saving itinerary:", err);
      showToast("儲存失敗，請檢查網路", "error");
    }
  };

  const dayDate = dayIndex > 0 ? DATES[dayIndex - 1] : '';

  return (
    <div className="pb-28"> 
      <div className="mb-6 px-6">
        <div className="flex justify-between items-start border-b border-wafu-indigo/10 pb-4">
          <div>
            <h2 className="text-3xl font-black font-serif text-wafu-indigo tracking-tight mb-2">
              {isTodo ? "行前準備" : `Day ${dayIndex}`}
            </h2>
            {!isTodo && weather && (
              <div className="flex items-center gap-2 text-sm text-wafu-text font-bold opacity-80 animate-fade-in cursor-pointer group" onClick={fetchWeather}>
                 {getWeatherIcon(weather.code)}
                 <span>{weather.location} {weather.temp}°C</span>
                 <Icons.Refresh className={`w-3 h-3 text-stone-400 group-hover:text-wafu-indigo transition-colors ${isWeatherLoading ? 'animate-spin' : ''}`} />
              </div>
            )}
            {!isTodo && !weather && (
               <button onClick={fetchWeather} className="flex items-center gap-1 text-xs text-stone-400 font-bold bg-stone-100 px-2 py-1 rounded-md mt-1 hover:bg-stone-200">
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

      <div className="space-y-6 px-3 sm:px-5 relative z-10">
        {!isTodo && items.length > 0 && (
           <div className="absolute left-[3.5rem] top-4 bottom-8 w-0.5 bg-gradient-to-b from-wafu-gold via-wafu-goldLight to-transparent z-0 opacity-50"></div>
        )}

        {items.map((item) => (
          <ItineraryItemCard 
            key={item.id}
            item={item}
            isTodo={!!isTodo}
            userLocation={userLocation}
            onFocus={onFocus}
            onEdit={handleEditClick}
            onDelete={handleDelete}
            onToggleComplete={toggleComplete}
          />
        ))}

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

      <div className="mt-12 px-6">
          <button onClick={handleOpenAdd} className="w-full py-4 border border-dashed border-wafu-indigo/20 rounded-2xl text-wafu-indigo/60 flex items-center justify-center gap-2 hover:bg-white hover:border-wafu-indigo/50 hover:text-wafu-indigo transition-all duration-100 active-bounce font-bold tracking-widest bg-white/40 font-serif">
            <Icons.Plus />
            {isTodo ? "新增待辦" : "追加行程"}
          </button>
      </div>

      <ItineraryForm 
        mode={modalMode}
        initialData={itemForm}
        isTodo={!!isTodo}
        onClose={() => setModalMode('closed')}
        onSave={handleSave}
      />
    </div>
  );
};
