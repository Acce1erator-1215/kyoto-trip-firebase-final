
import React, { useState, useMemo } from 'react';
import { Restaurant } from '../types';
import { Icons } from './Icon';
import { db, sanitizeData } from '../firebase';
// Removed v9 modular imports
import { useDraggableScroll } from '../hooks/useDraggableScroll';
import { FoodItemCard } from './food/FoodItemCard';
import { FoodForm } from './food/FoodForm';
import { calculateDistance } from '../services/geoUtils';

interface Props {
  items: Restaurant[];
  userLocation?: { lat: number, lng: number } | null;
  onFocus?: (lat: number, lng: number) => void;
}

const PREDEFINED_TAGS = ['拉麵', '甜點', '咖哩', '燒肉', '火鍋', '大阪燒', '壽司', '咖啡'];

export const FoodList: React.FC<Props> = ({ items, userLocation, onFocus }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Multi-select state
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<Partial<Restaurant>>({
    name: '',
    description: '',
    rating: 3.0,
    imageUrl: '',
    mapsUrl: '',
    tags: [],
    lat: undefined,
    lng: undefined
  });

  // Calculate all used tags for filter/form suggestions
  const allUsedTags = Array.from(new Set([
      ...PREDEFINED_TAGS,
      ...items.flatMap(i => i.tags || [])
  ]));

  // Draggable scroll for tags
  const scrollLogic = useDraggableScroll({ direction: 'horizontal' });

  const activeItems = items.filter(i => !i.deleted);
  const deletedItems = items.filter(i => i.deleted);

  const filteredItems = activeTagFilters.length === 0 
    ? activeItems 
    : activeItems.filter(i => i.tags?.some(tag => activeTagFilters.includes(tag)));

  // 依距離排序邏輯
  const sortedItems = useMemo(() => {
    if (!userLocation) return filteredItems;

    return [...filteredItems].sort((a, b) => {
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
  }, [filteredItems, userLocation]);

  const handleTagClick = (tag: string) => {
      scrollLogic.onEntryClick(() => {
          if (activeTagFilters.includes(tag)) {
              setActiveTagFilters(activeTagFilters.filter(t => t !== tag));
          } else {
              setActiveTagFilters([...activeTagFilters, tag]);
          }
      });
  };

  const handleClearClick = () => {
      scrollLogic.onEntryClick(() => setActiveTagFilters([]));
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', rating: 3.0, imageUrl: '', mapsUrl: '', tags: [], lat: undefined, lng: undefined });
    setIsAdding(true);
  };

  const openEdit = (item: Restaurant, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(item.id);
    setFormData({ ...item, tags: item.tags || [] });
    setIsAdding(true);
  };

  const handleSave = async (finalData: Partial<Restaurant>) => {
    try {
        if (editingId) {
            const cleanData = sanitizeData(finalData);
            await db.collection('restaurants').doc(editingId).update(cleanData);
        } else {
            const newId = Date.now().toString();
            const item = {
                id: newId,
                name: finalData.name,
                description: finalData.description || '',
                rating: finalData.rating || 3.0,
                imageUrl: finalData.imageUrl || '', 
                mapsUrl: finalData.mapsUrl || '',
                tags: finalData.tags || [],
                lat: finalData.lat,
                lng: finalData.lng,
                deleted: false
            };
            const cleanItem = sanitizeData(item);
            await db.collection('restaurants').doc(newId).set(cleanItem);
        }
        setIsAdding(false);
    } catch (err) {
        console.error("Error saving restaurant:", err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await db.collection('restaurants').doc(id).update({ deleted: true });
  };

  const handleRestore = async (id: string) => {
    await db.collection('restaurants').doc(id).update({ deleted: false });
  };

  const handlePermanentDelete = async (id: string) => {
    await db.collection('restaurants').doc(id).delete();
  };

  return (
    // Update padding to pb-28
    <div className="pb-28 px-5">
      <div className="mb-4 border-b border-wafu-indigo/20 pb-4 mx-1">
        <h2 className="text-3xl font-black font-serif text-wafu-indigo tracking-wide">美食清單</h2>
      </div>

      {/* Tag Filters */}
      <div 
        ref={scrollLogic.ref}
        {...scrollLogic.events}
        className={`flex gap-2 mb-6 overflow-x-auto pb-1 ${scrollLogic.className}`}
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
        {sortedItems.map(item => (
           <FoodItemCard 
             key={item.id}
             item={item}
             userLocation={userLocation}
             onFocus={onFocus}
             onEdit={openEdit}
             onDelete={handleDelete}
           />
        ))}

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

      <FoodForm 
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title={editingId ? '編輯餐廳' : '新增餐廳'}
        initialData={formData}
        availableTags={allUsedTags}
        onSave={handleSave}
      />
    </div>
  );
};
