
import React, { useState } from 'react';
import { ShoppingItem, Expense } from '../types';
import { Icons } from './Icon';
import { db, sanitizeData } from '../firebase';
// Removed v9 modular imports
import { ShoppingItemCard } from './shopping/ShoppingItemCard';
import { ShoppingForm } from './shopping/ShoppingForm';

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
  
  const exchangeRate = currentRate;
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

  const handleSave = (formData: Partial<ShoppingItem>) => {
    if (!formData.name) return;
    
    // 樂觀 UI
    setIsAdding(false);
    
    (async () => {
        try {
            if (editingId) {
                const cleanData = sanitizeData(formData);
                await db.collection('shopping').doc(editingId).update(cleanData);
                
                // 邏輯：如果該項目已購買且有關聯的支出，需同步更新支出金額
                if (formData.bought && formData.linkedExpenseId) {
                    const totalYen = (formData.priceYen || 0) * (formData.quantity || 1);
                    await db.collection('expenses').doc(formData.linkedExpenseId).update({
                        title: formData.name,
                        amountYen: totalYen,
                        quantity: formData.quantity
                    }).catch(e => console.error("關聯支出未找到或更新失敗", e));
                }
            } else {
                const newId = Date.now().toString();
                const itemData = {
                    id: newId,
                    name: formData.name,
                    description: formData.description || '',
                    priceYen: formData.priceYen || 0,
                    bought: false,
                    imageUrl: formData.imageUrl || `https://picsum.photos/300/300?random=${newId}`,
                    quantity: formData.quantity || 1,
                    flavor: formData.flavor,
                    deleted: false
                };
                const cleanItem = sanitizeData(itemData);
                await db.collection('shopping').doc(newId).set(cleanItem);
            }
            // 重置表單
            setNewItem({ name: '', description: '', priceYen: 0, imageUrl: '', quantity: 1, flavor: undefined });
        } catch (err) {
            console.error("Error saving shopping item:", err);
            alert("儲存失敗，請檢查網路連線");
        }
    })();
  };

  // 切換購買狀態 (使用 db.batch() 確保原子性：Shopping 狀態更新 + Expense 新增/刪除)
  const toggleBought = async (id: string, currentItem: ShoppingItem) => {
    const newBoughtState = !currentItem.bought;
    let newLinkedId = currentItem.linkedExpenseId;

    try {
        const batch = db.batch();

        // 同步支出邏輯
        if (newBoughtState) {
          // 若標記為已買，則自動在 expenses 集合新增一筆支出
          const totalYen = (currentItem.priceYen || 0) * (currentItem.quantity || 1);
          const expenseId = Date.now().toString();
          const expenseRef = db.collection('expenses').doc(expenseId);
          
          batch.set(expenseRef, {
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
            const expenseRef = db.collection('expenses').doc(currentItem.linkedExpenseId);
            batch.delete(expenseRef);
          }
          newLinkedId = null; // Firestore null
        }

        // 更新購物項目狀態
        const shoppingRef = db.collection('shopping').doc(id);
        batch.update(shoppingRef, { 
            bought: newBoughtState, 
            linkedExpenseId: newLinkedId
        });

        await batch.commit();

    } catch (err) {
        console.error("Error toggling bought state with batch:", err);
    }
  };

  // 刪除邏輯 (如果有關聯支出也會一併刪除)
  const handleDelete = async (id: string, item: ShoppingItem, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await db.collection('shopping').doc(id).update({ deleted: true });

        if (item.linkedExpenseId) {
             await db.collection('expenses').doc(item.linkedExpenseId).delete();
        }
      } catch (err) {
          console.error("Error deleting shopping item:", err);
      }
  };

  const handleRestore = async (id: string) => {
      await db.collection('shopping').doc(id).update({ deleted: false });
  };

  const handlePermanentDelete = async (id: string) => {
      await db.collection('shopping').doc(id).delete();
  };

  // 更新數量 (同步計算總價)
  const updateQuantity = async (id: string, delta: number, currentItem: ShoppingItem) => {
    const currentQty = currentItem.quantity || 1;
    const newQty = Math.max(1, currentQty + delta);
    
    try {
        await db.collection('shopping').doc(id).update({ quantity: newQty });

        // 如果已買，同步更新支出金額
        if (currentItem.bought && currentItem.linkedExpenseId) {
            const newTotalYen = (currentItem.priceYen || 0) * newQty;
            await db.collection('expenses').doc(currentItem.linkedExpenseId).update({
                quantity: newQty,
                amountYen: newTotalYen
            });
        }
    } catch (err) {
        console.error("Error updating quantity:", err);
    }
  };

  return (
    // iOS Adaptive Padding
    <div className="pb-[calc(env(safe-area-inset-bottom)+6rem)] px-4">
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
        {filteredItems.map(item => (
           <ShoppingItemCard 
             key={item.id}
             item={item}
             exchangeRate={exchangeRate}
             onEdit={openEdit}
             onDelete={handleDelete}
             onToggleBought={toggleBought}
             onUpdateQuantity={updateQuantity}
           />
        ))}
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

      <ShoppingForm
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        title={editingId ? '編輯項目' : '新增伴手禮'}
        initialData={newItem}
        onConfirm={handleSave}
      />
    </div>
  );
};
