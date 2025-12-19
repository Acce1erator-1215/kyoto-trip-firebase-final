import React, { useState } from 'react';
import { ShoppingItem, Expense } from '../types';
import { Icons } from './Icon';
import { db, sanitizeData } from '../firebase';
import { useToast } from '../context/ToastContext';
// Removed v9 modular imports
import { ShoppingItemCard } from './shopping/ShoppingItemCard';
import { ShoppingForm } from './shopping/ShoppingForm';

interface Props {
  items: ShoppingItem[];
  expenses: Expense[];
  currentRate?: number;
}

export const ShoppingList: React.FC<Props> = ({ items, expenses, currentRate = 0.22 }) => {
  const { showToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [activeFlavorFilters, setActiveFlavorFilters] = useState<('sweet' | 'salty' | 'misc')[]>([]);

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
  
  const filteredItems = activeItems.filter(item => {
      if (activeFlavorFilters.length === 0) return true;
      return item.flavor && activeFlavorFilters.includes(item.flavor);
  });

  const toggleFlavorFilter = (flavor: 'sweet' | 'salty' | 'misc') => {
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
    setIsAdding(false);
    
    (async () => {
        try {
            if (editingId) {
                const cleanData = sanitizeData(formData);
                await db.collection('shopping').doc(editingId).update(cleanData);
                
                if (formData.bought && formData.linkedExpenseId) {
                    const totalYen = (formData.priceYen || 0) * (formData.quantity || 1);
                    await db.collection('expenses').doc(formData.linkedExpenseId).update({
                        title: formData.name,
                        amountYen: totalYen,
                        quantity: formData.quantity
                    }).catch(e => console.error("關聯支出未找到或更新失敗", e));
                }
                showToast("商品更新成功", "success");
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
                showToast("商品新增成功", "success");
            }
            setNewItem({ name: '', description: '', priceYen: 0, imageUrl: '', quantity: 1, flavor: undefined });
        } catch (err) {
            console.error("Error saving shopping item:", err);
            showToast("儲存失敗", "error");
        }
    })();
  };

  const toggleBought = async (id: string, currentItem: ShoppingItem) => {
    const newBoughtState = !currentItem.bought;
    let newLinkedId = currentItem.linkedExpenseId;

    try {
        const batch = db.batch();

        if (newBoughtState) {
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
          if (currentItem.linkedExpenseId) {
            const expenseRef = db.collection('expenses').doc(currentItem.linkedExpenseId);
            batch.delete(expenseRef);
          }
          newLinkedId = null; 
        }

        const shoppingRef = db.collection('shopping').doc(id);
        batch.update(shoppingRef, { 
            bought: newBoughtState, 
            linkedExpenseId: newLinkedId
        });

        await batch.commit();
        if(newBoughtState) showToast("已購入 記帳成功", "success");

    } catch (err) {
        console.error("Error toggling bought state with batch:", err);
        showToast("狀態更新失敗", "error");
    }
  };

  const handleDelete = async (id: string, item: ShoppingItem, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const batch = db.batch();
        
        // 1. Soft delete the shopping item
        const shoppingRef = db.collection('shopping').doc(id);
        batch.update(shoppingRef, { deleted: true });

        // 2. Soft delete the linked expense (if exists)
        if (item.linkedExpenseId) {
             const expenseRef = db.collection('expenses').doc(item.linkedExpenseId);
             batch.update(expenseRef, { deleted: true });
        }
        
        await batch.commit();
        showToast("已移至回收桶", "info");
      } catch (err) {
          console.error("Error deleting shopping item:", err);
          showToast("刪除失敗", "error");
      }
  };

  const handleRestore = async (item: ShoppingItem) => {
      try {
        const batch = db.batch();

        // 1. Restore shopping item
        const shoppingRef = db.collection('shopping').doc(item.id);
        batch.update(shoppingRef, { deleted: false });

        // 2. Restore linked expense (if exists)
        if (item.linkedExpenseId) {
            const expenseRef = db.collection('expenses').doc(item.linkedExpenseId);
            // Note: Update might fail if expense was hard deleted previously, 
            // but for soft-delete workflow this is correct.
            batch.update(expenseRef, { deleted: false });
        }

        await batch.commit();
        showToast("商品已復原", "success");
      } catch (err) {
          console.error("Error restoring item:", err);
          showToast("復原失敗", "error");
      }
  };

  const handlePermanentDelete = async (item: ShoppingItem) => {
      try {
        const batch = db.batch();
        
        const shoppingRef = db.collection('shopping').doc(item.id);
        batch.delete(shoppingRef);

        if (item.linkedExpenseId) {
            const expenseRef = db.collection('expenses').doc(item.linkedExpenseId);
            batch.delete(expenseRef);
        }

        await batch.commit();
        showToast("商品永久刪除", "success");
      } catch (err) {
        console.error("Error permanent deleting:", err);
        showToast("刪除失敗", "error");
      }
  };

  const updateQuantity = async (id: string, delta: number, currentItem: ShoppingItem) => {
    const currentQty = currentItem.quantity || 1;
    const newQty = Math.max(1, currentQty + delta);
    
    try {
        await db.collection('shopping').doc(id).update({ quantity: newQty });

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
    <div className="pb-28 px-4">
      <div className="mb-4 border-b border-wafu-indigo/20 pb-4 mx-1">
        <h2 className="text-3xl font-black font-serif text-wafu-indigo tracking-wide">伴手禮</h2>
      </div>

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
          <button 
            onClick={() => toggleFlavorFilter('misc')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeFlavorFilters.includes('misc') ? 'bg-teal-100 text-teal-700 border-teal-200 shadow-sm' : 'bg-white text-stone-400 border-stone-200'}`}
          >
            雜貨 📦
          </button>
      </div>

      {/* RWD Grid: 2 cols -> 3 cols -> 4 cols -> 5 cols */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 mb-10">
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
                             onClick={() => handleRestore(item)}
                             className="text-xs bg-stone-200 hover:bg-wafu-indigo hover:text-white px-2 py-1 rounded-md transition-colors font-bold active-bounce"
                           >
                             復原
                           </button>
                           <button 
                             onClick={() => handlePermanentDelete(item)}
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