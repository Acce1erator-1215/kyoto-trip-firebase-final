
import React, { useState, useEffect } from 'react';
import { ShoppingItem, Expense } from '../types';
import { Icons } from './Icon';
import { db, sanitizeData } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc, collection } from 'firebase/firestore';
import { useImageUpload } from '../hooks/useImageUpload'; // 引入圖片上傳 Hook

interface Props {
  items: ShoppingItem[];
  expenses: Expense[];
  currentRate?: number;
}

/**
 * 伴手禮/購物清單組件
 * 特點：
 * 1. 購買後 (Checked) 自動產生一筆對應的「支出紀錄」
 * 2. 支援口味篩選 (甜/鹹)
 * 3. 即時台幣換算顯示
 */
export const ShoppingList: React.FC<Props> = ({ items, expenses, currentRate = 0.22 }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 多選篩選狀態 (口味)
  const [activeFlavorFilters, setActiveFlavorFilters] = useState<('sweet' | 'salty')[]>([]);

  const [newItem, setNewItem] = useState<Partial<ShoppingItem>>({
    name: '',
    description: '',
    priceYen: 0,
    imageUrl: '',
    quantity: 1,
    flavor: undefined
  });
  
  // 使用 hook 處理圖片邏輯 (含貼上)
  const { fileInputRef, handleImageUpload, triggerUpload, handlePaste, handleClipboardRead } = useImageUpload();
  const exchangeRate = currentRate;

  // 監聽貼上事件
  useEffect(() => {
    if (!isAdding) return;

    const onPaste = (e: ClipboardEvent) => {
        handlePaste(e, (base64) => setNewItem(prev => ({ ...prev, imageUrl: base64 })));
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [isAdding, handlePaste]);

  const activeItems = items.filter(i => !i.deleted);
  const deletedItems = items.filter(i => i.deleted);
  
  // 篩選邏輯：若無篩選條件則顯示全部，否則顯示符合任一口味者
  const filteredItems = activeItems.filter(item => {
      if (activeFlavorFilters.length === 0) return true;
      return item.flavor && activeFlavorFilters.includes(item.flavor);
  });

  const toggleFlavorFilter = (flavor: 'sweet' | 'salty') => {
      if (activeFlavorFilters.includes(flavor)) {
          setActiveFlavorFilters(activeFlavorFilters.filter(f => f !== flavor));
      } else {
          setActiveFlavorFilters([...activeFlavorFilters, flavor]);
      }
  };

  const clearFlavorFilters = () => {
      setActiveFlavorFilters([]);
  };

  const openAdd = () => {
    setEditingId(null);
    setNewItem({ name: '', description: '', priceYen: 0, imageUrl: '', quantity: 1, flavor: undefined });
    setIsAdding(true);
  };

  const openEdit = (item: ShoppingItem) => {
    setEditingId(item.id);
    setNewItem({ ...item });
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!newItem.name) return;
    
    // 樂觀 UI
    setIsAdding(false);
    
    (async () => {
        try {
            if (editingId) {
                const cleanData = sanitizeData(newItem);
                await updateDoc(doc(db, 'shopping', editingId), cleanData);
                
                // 邏輯：如果該項目已購買且有關聯的支出，需同步更新支出金額
                if (newItem.bought && newItem.linkedExpenseId) {
                    const totalYen = (newItem.priceYen || 0) * (newItem.quantity || 1);
                    await updateDoc(doc(db, 'expenses', newItem.linkedExpenseId), {
                        title: newItem.name,
                        amountYen: totalYen,
                        quantity: newItem.quantity
                    }).catch(e => console.log("關聯支出未找到或更新失敗", e));
                }
            } else {
                const newId = Date.now().toString();
                const itemData = {
                    id: newId,
                    name: newItem.name,
                    description: newItem.description || '',
                    priceYen: newItem.priceYen || 0,
                    bought: false,
                    imageUrl: newItem.imageUrl || `https://picsum.photos/300/300?random=${newId}`,
                    quantity: newItem.quantity || 1,
                    flavor: newItem.flavor,
                    deleted: false
                };
                const cleanItem = sanitizeData(itemData);
                await setDoc(doc(db, 'shopping', newId), cleanItem);
            }
            // 重置表單
            setNewItem({ name: '', description: '', priceYen: 0, imageUrl: '', quantity: 1, flavor: undefined });
        } catch (err) {
            console.error("Error saving shopping item:", err);
            alert("儲存失敗，請檢查網路連線");
        }
    })();
  };

  // 切換購買狀態 (同步新增/刪除支出紀錄)
  const toggleBought = async (id: string, currentItem: ShoppingItem) => {
    const newBoughtState = !currentItem.bought;
    let newLinkedId = currentItem.linkedExpenseId;

    try {
        // 同步支出邏輯
        if (newBoughtState) {
          // 若標記為已買，則自動在 expenses 集合新增一筆支出
          const totalYen = (currentItem.priceYen || 0) * (currentItem.quantity || 1);
          const expenseId = Date.now().toString();
          
          await setDoc(doc(db, 'expenses', expenseId), {
            id: expenseId,
            title: `${currentItem.name}`,
            amountYen: totalYen,
            category: 'shopping',
            payer: 'Me',
            date: new Date().toISOString().split('T')[0],
            quantity: currentItem.quantity || 1,
            deleted: false
          });
          newLinkedId = expenseId;
        } else {
          // 若取消購買，則刪除對應的支出紀錄
          if (currentItem.linkedExpenseId) {
            await deleteDoc(doc(db, 'expenses', currentItem.linkedExpenseId));
          }
          newLinkedId = undefined; // Firestore 中會變成 null
        }

        // 更新購物項目狀態
        await updateDoc(doc(db, 'shopping', id), { 
            bought: newBoughtState, 
            linkedExpenseId: newLinkedId || null
        });

    } catch (err) {
        console.error("Error toggling bought state:", err);
    }
  };

  // 刪除邏輯 (如果有關聯支出也會一併刪除)
  const handleDelete = async (id: string, item: ShoppingItem, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await updateDoc(doc(db, 'shopping', id), { deleted: true });

        if (item.linkedExpenseId) {
             await deleteDoc(doc(db, 'expenses', item.linkedExpenseId));
        }
      } catch (err) {
          console.error("Error deleting shopping item:", err);
      }
  };

  const handleRestore = async (id: string) => {
      await updateDoc(doc(db, 'shopping', id), { deleted: false });
  };

  const handlePermanentDelete = async (id: string) => {
      await deleteDoc(doc(db, 'shopping', id));
  };

  // 更新數量 (同步計算總價)
  const updateQuantity = async (id: string, delta: number, currentItem: ShoppingItem) => {
    const currentQty = currentItem.quantity || 1;
    const newQty = Math.max(1, currentQty + delta);
    
    try {
        await updateDoc(doc(db, 'shopping', id), { quantity: newQty });

        // 如果已買，同步更新支出金額
        if (currentItem.bought && currentItem.linkedExpenseId) {
            const newTotalYen = (currentItem.priceYen || 0) * newQty;
            await updateDoc(doc(db, 'expenses', currentItem.linkedExpenseId), {
                quantity: newQty,
                amountYen: newTotalYen
            });
        }
    } catch (err) {
        console.error("Error updating quantity:", err);
    }
  };

  return (
    <div className="pb-40 px-4">
      <div className="mb-4 border-b border-wafu-indigo/20 pb-4 mx-1">
        <h2 className="text-3xl font-black font-serif text-wafu-indigo tracking-wide">伴手禮</h2>
      </div>

      {/* 多選篩選 Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          <button 
            onClick={clearFlavorFilters}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeFlavorFilters.length === 0 ? 'bg-wafu-indigo text-white border-wafu-indigo' : 'bg-white text-stone-400 border-stone-200'}`}
          >
            全部 ({activeItems.length})
          </button>
          <button 
            onClick={() => toggleFlavorFilter('sweet')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeFlavorFilters.includes('sweet') ? 'bg-pink-100 text-pink-700 border-pink-200 shadow-sm' : 'bg-white text-stone-400 border-stone-200'}`}
          >
            甜食 🍰
          </button>
          <button 
            onClick={() => toggleFlavorFilter('salty')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeFlavorFilters.includes('salty') ? 'bg-orange-100 text-orange-700 border-orange-200 shadow-sm' : 'bg-white text-stone-400 border-stone-200'}`}
          >
            鹹食 🍘
          </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-10">
        {filteredItems.map(item => {
           const qty = item.quantity || 1;
           const totalPriceYen = (item.priceYen || 0) * qty;
           const totalPriceTwd = Math.round(totalPriceYen * exchangeRate);

           return (
            <div key={item.id} className="bg-white rounded-2xl shadow-washi border border-stone-100 overflow-hidden group flex flex-col relative transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] animate-zoom-in">
                <div className="absolute inset-0 bg-wafu-paper opacity-50 pointer-events-none z-10 mix-blend-multiply"></div>

                {/* 圖片區域 (點擊編輯) */}
                <div className="h-28 bg-stone-100 relative overflow-hidden cursor-pointer" onClick={() => openEdit(item)}>
                    <img src={item.imageUrl} alt={item.name} className={`w-full h-full object-cover transition-all duration-500 ${item.bought ? 'grayscale opacity-50' : 'group-hover:scale-110'}`} />
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleBought(item.id, item); }}
                        className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-20 ${item.bought ? 'animate-pop' : ''}
                        ${item.bought ? 'bg-wafu-gold text-white' : 'bg-white text-stone-300'}`}
                    >
                        <Icons.Check />
                    </button>
                    {item.flavor && (
                        <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold z-20 shadow-sm
                            ${item.flavor === 'sweet' ? 'bg-pink-100/90 text-pink-700' : 'bg-orange-100/90 text-orange-700'}
                        `}>
                            {item.flavor === 'sweet' ? '甜' : '鹹'}
                        </div>
                    )}
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between relative z-20">
                    <div>
                        <div className="flex justify-between items-start mb-1">
                            <h3 className={`font-serif font-bold text-sm leading-tight line-clamp-2 ${item.bought ? 'text-stone-400 line-through' : 'text-wafu-text'}`}>
                                {item.name}
                            </h3>
                            <button 
                                onClick={(e) => handleDelete(item.id, item, e)} 
                                className="text-stone-200 hover:text-stone-400 -mr-1 -mt-1 p-1"
                            >
                                <Icons.Trash />
                            </button>
                        </div>
                        <p className="text-[10px] text-stone-400 line-clamp-1">{item.description}</p>
                    </div>
                    
                    <div className="mt-3 flex items-end justify-between">
                        <div className="flex flex-col">
                            <div className="text-[10px] text-stone-400 font-mono">¥{item.priceYen?.toLocaleString()} ea</div>
                            <div className="text-sm font-bold text-wafu-indigo font-mono">
                                NT$ {totalPriceTwd.toLocaleString()}
                            </div>
                        </div>
                        
                        {/* 數量控制 */}
                        <div className="flex items-center bg-stone-50 rounded-lg border border-stone-100 h-6">
                             <button 
                                onClick={() => updateQuantity(item.id, -1, item)}
                                className="px-1.5 h-full flex items-center justify-center text-stone-400 hover:text-wafu-indigo active:bg-stone-200"
                             >
                                -
                             </button>
                             <span className="text-xs font-bold text-wafu-indigo px-1">{qty}</span>
                             <button 
                                onClick={() => updateQuantity(item.id, 1, item)}
                                className="px-1.5 h-full flex items-center justify-center text-stone-400 hover:text-wafu-indigo active:bg-stone-200"
                             >
                                +
                             </button>
                        </div>
                    </div>
                </div>
            </div>
           );
        })}
      </div>

      <button 
          onClick={openAdd}
          className="w-full py-4 border border-dashed border-wafu-indigo/20 rounded-2xl text-wafu-indigo/60 flex items-center justify-center gap-2 hover:bg-white hover:border-wafu-indigo/50 hover:text-wafu-indigo transition-all duration-100 active-bounce font-bold tracking-widest bg-white/40 font-serif"
        >
          <Icons.Plus /> 新增項目
      </button>

      {deletedItems.length > 0 && (
          <div className="mt-8 px-2">
             <button 
               onClick={() => setShowTrash(!showTrash)}
               className="flex items-center gap-2 text-stone-400 hover:text-wafu-indigo text-xs font-bold uppercase tracking-wider mb-3 transition-colors active-bounce"
             >
                <Icons.Trash />
                <span>已刪除項目 ({deletedItems.length})</span>
             </button>
             
             {showTrash && (
               <div className="space-y-3 bg-stone-50/50 p-4 rounded-xl border border-stone-100">
                  {deletedItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center opacity-60 hover:opacity-100 transition-opacity gap-2">
                       <span className="text-sm text-stone-500 font-serif truncate flex-1">{item.name}</span>
                       <div className="flex gap-1 shrink-0">
                           <button 
                             onClick={() => handleRestore(item.id)}
                             className="text-xs bg-stone-200 hover:bg-wafu-indigo hover:text-white px-2 py-1 rounded-md transition-colors font-bold active-bounce"
                           >
                             復原
                           </button>
                           <button 
                             onClick={() => handlePermanentDelete(item.id)}
                             className="text-xs bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-500 px-2 py-1 rounded-md transition-colors font-bold active-bounce"
                           >
                             永久刪除
                           </button>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-wafu-darkIndigo/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl animate-modal-slide-up relative max-h-[85dvh] flex flex-col overflow-hidden">
             
             <div className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-wafu-indigo bg-wafu-indigo rounded-t-2xl shadow-md z-20">
                 <button 
                    onClick={() => setIsAdding(false)} 
                    className="text-white/80 font-bold text-base hover:text-white transition-colors active-bounce px-2"
                 >
                    取消
                 </button>
                 <h3 className="text-lg font-bold font-serif text-white tracking-widest">
                    {editingId ? '編輯項目' : '新增伴手禮'}
                 </h3>
                 <button 
                    onClick={handleSave}
                    disabled={!newItem.name} 
                    className="bg-white text-wafu-indigo text-sm px-4 py-1.5 rounded-lg font-bold shadow-sm hover:bg-stone-100 disabled:opacity-50 disabled:shadow-none transition-all active-bounce flex items-center gap-2"
                 >
                    儲存
                 </button>
             </div>
             
             <div className="flex-1 overflow-y-auto px-6 py-6 pb-10 relative bg-white">
                <div className="absolute inset-0 bg-wafu-paper opacity-50 pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="relative w-full mb-6">
                        <div 
                            onClick={triggerUpload}
                            className="w-full h-32 rounded-xl bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:bg-stone-100 overflow-hidden relative active-bounce transition-transform"
                        >
                            {newItem.imageUrl ? (
                                <img src={newItem.imageUrl} className="w-full h-full object-cover" alt="preview" />
                            ) : (
                                <div className="flex flex-col items-center text-stone-400">
                                    <Icons.Plus />
                                    <span className="text-[10px] mt-1 font-bold">商品照片 (可直接貼上)</span>
                                </div>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={(e) => handleImageUpload(e, (base64) => setNewItem({...newItem, imageUrl: base64}))} 
                                accept="image/*,image/heic,image/heif" 
                                hidden 
                            />
                        </div>
                        {/* 手機版貼上按鈕 */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClipboardRead((base64) => setNewItem({...newItem, imageUrl: base64}));
                            }}
                            className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-wafu-indigo text-[10px] px-2 py-1.5 rounded-lg shadow-sm border border-stone-200 font-bold hover:bg-white active:scale-95 flex items-center gap-1 z-20 transition-all"
                        >
                            <span>📋</span>
                            <span>貼上</span>
                        </button>
                    </div>

                    <div className="space-y-5">
                        <input 
                          className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-lg font-bold font-serif" 
                          placeholder="商品名稱"
                          value={newItem.name}
                          onChange={e => setNewItem({...newItem, name: e.target.value})}
                        />

                        {/* 口味選擇 */}
                        <div className="flex gap-4">
                            <label className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all active-bounce
                                ${newItem.flavor === 'sweet' ? 'bg-pink-50 border-pink-300 text-pink-700' : 'bg-stone-50 border-stone-200 text-stone-400'}`}>
                                <input 
                                    type="radio" 
                                    name="flavor" 
                                    className="hidden" 
                                    checked={newItem.flavor === 'sweet'} 
                                    onChange={() => setNewItem({...newItem, flavor: 'sweet'})} 
                                />
                                <span className="text-sm font-bold">甜食 🍰</span>
                            </label>
                            <label className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all active-bounce
                                ${newItem.flavor === 'salty' ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-stone-50 border-stone-200 text-stone-400'}`}>
                                <input 
                                    type="radio" 
                                    name="flavor" 
                                    className="hidden" 
                                    checked={newItem.flavor === 'salty'} 
                                    onChange={() => setNewItem({...newItem, flavor: 'salty'})} 
                                />
                                <span className="text-sm font-bold">鹹食 🍘</span>
                            </label>
                        </div>
                        
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-[10px] text-stone-400 font-bold uppercase mb-1 block">單價 (JPY)</label>
                                <input 
                                    type="number"
                                    className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-lg font-mono font-bold"
                                    placeholder="0"
                                    value={newItem.priceYen || ''}
                                    onChange={e => setNewItem({...newItem, priceYen: parseInt(e.target.value) || 0})}
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="text-[10px] text-stone-400 font-bold uppercase mb-1 block">數量</label>
                                <input 
                                    type="number"
                                    className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-lg font-mono font-bold text-center"
                                    value={newItem.quantity}
                                    onChange={e => setNewItem({...newItem, quantity: Math.max(1, parseInt(e.target.value) || 1)})}
                                />
                            </div>
                        </div>

                        <textarea 
                          className="w-full p-4 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo resize-none h-24 placeholder:text-stone-300 text-base" 
                          placeholder="備註..."
                          value={newItem.description}
                          onChange={e => setNewItem({...newItem, description: e.target.value})}
                        />
                    </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
