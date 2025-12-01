
import React, { useState, useRef } from 'react';
import { ShoppingItem, Expense } from '../types';
import { Icons } from './Icon';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc, collection } from 'firebase/firestore';

interface Props {
  items: ShoppingItem[];
  setItems: any; // Legacy
  expenses: Expense[];
  setExpenses: any; // Legacy
}

export const ShoppingList: React.FC<Props> = ({ items, expenses }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<ShoppingItem>>({
    name: '',
    description: '',
    priceYen: 0,
    imageUrl: '',
    quantity: 1
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exchangeRate = 0.22;

  const activeItems = items.filter(i => !i.deleted);
  const deletedItems = items.filter(i => i.deleted);

  const openAdd = () => {
    setEditingId(null);
    setNewItem({ name: '', description: '', priceYen: 0, imageUrl: '', quantity: 1 });
    setIsAdding(true);
  };

  const openEdit = (item: ShoppingItem) => {
    setEditingId(item.id);
    setNewItem({ ...item });
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!newItem.name) return;
    
    // Optimistic UI: Close immediately
    setIsAdding(false);
    
    (async () => {
        try {
            if (editingId) {
                await updateDoc(doc(db, 'shopping', editingId), { ...newItem });
                
                // If bought, update the linked expense as well
                if (newItem.bought && newItem.linkedExpenseId) {
                    const totalYen = (newItem.priceYen || 0) * (newItem.quantity || 1);
                    await updateDoc(doc(db, 'expenses', newItem.linkedExpenseId), {
                        title: newItem.name,
                        amountYen: totalYen,
                        quantity: newItem.quantity
                    }).catch(e => console.log("Linked expense not found or error", e));
                }
            } else {
                const newId = Date.now().toString();
                await setDoc(doc(db, 'shopping', newId), {
                    id: newId,
                    name: newItem.name,
                    description: newItem.description || '',
                    priceYen: newItem.priceYen || 0,
                    bought: false,
                    imageUrl: newItem.imageUrl || `https://picsum.photos/300/300?random=${newId}`,
                    quantity: newItem.quantity || 1,
                    deleted: false
                });
            }
            // Reset form
            setNewItem({ name: '', description: '', priceYen: 0, imageUrl: '', quantity: 1 });
        } catch (err) {
            console.error("Error saving shopping item:", err);
            alert("儲存失敗，請檢查網路連線");
        }
    })();
  };

  const toggleBought = async (id: string, currentItem: ShoppingItem) => {
    const newBoughtState = !currentItem.bought;
    let newLinkedId = currentItem.linkedExpenseId;

    try {
        // Sync with Expenses
        if (newBoughtState) {
          // Add to Expenses Collection
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
          // Remove from Expenses Collection
          if (currentItem.linkedExpenseId) {
            await deleteDoc(doc(db, 'expenses', currentItem.linkedExpenseId));
          }
          newLinkedId = undefined; // Actually null/undefined in DB
        }

        // Update Shopping Item
        await updateDoc(doc(db, 'shopping', id), { 
            bought: newBoughtState, 
            linkedExpenseId: newLinkedId || null // Firestore doesn't like undefined
        });

    } catch (err) {
        console.error("Error toggling bought state:", err);
    }
  };

  const handleDelete = async (id: string, item: ShoppingItem) => {
      try {
        // Soft delete shopping item
        await updateDoc(doc(db, 'shopping', id), { deleted: true });

        // If it was linked to an expense, we should probably delete the expense too?
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

  const updateQuantity = async (id: string, delta: number, currentItem: ShoppingItem) => {
    const currentQty = currentItem.quantity || 1;
    const newQty = Math.max(1, currentQty + delta);
    
    try {
        await updateDoc(doc(db, 'shopping', id), { quantity: newQty });

        // If bought, update linked expense
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem({ ...newItem, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="pb-40 px-5">
      <div className="mb-8 border-b border-wafu-indigo/20 pb-4 mx-1">
        <h2 className="text-3xl font-black font-serif text-wafu-indigo tracking-wide">伴手禮</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        {activeItems.map(item => {
           const qty = item.quantity || 1;
           const totalPriceYen = (item.priceYen || 0) * qty;
           const totalPriceTwd = Math.round(totalPriceYen * exchangeRate);

           return (
            <div key={item.id} className="bg-white rounded-2xl shadow-washi border border-stone-100 overflow-hidden group flex flex-col relative transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] animate-zoom-in">
                <div className="absolute inset-0 bg-wafu-paper opacity-50 pointer-events-none z-10 mix-blend-multiply"></div>

                <div className="h-36 bg-stone-100 relative overflow-hidden cursor-pointer" onClick={() => openEdit(item)}>
                    <img src={item.imageUrl} alt={item.name} className={`w-full h-full object-cover transition-all duration-500 ${item.bought ? 'grayscale opacity-50' : 'group-hover:scale-110'}`} />
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleBought(item.id, item); }}
                        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-20 ${item.bought ? 'animate-pop' : ''}
                        ${item.bought ? 'bg-wafu-gold text-white' : 'bg-white text-stone-300 hover:text-wafu-indigo'}
                        `}>
                        <Icons.ShoppingBag />
                    </button>
                    <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="bg-white/90 rounded-full p-1.5 shadow-sm text-stone-400">
                             <Icons.Edit />
                         </div>
                    </div>
                </div>

                <div className="p-4 flex-1 flex flex-col relative z-20">
                    <h3 className={`font-serif font-bold text-base text-wafu-text truncate leading-snug tracking-wide ${item.bought ? 'line-through decoration-stone-300 text-stone-400' : ''}`}>
                        {item.name}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2 mt-2 flex-1 leading-relaxed opacity-80 font-serif">{item.description}</p>
                    
                    <div className="flex items-center justify-between mt-3 bg-stone-50 rounded-lg p-1 border border-stone-100">
                        <button onClick={() => updateQuantity(item.id, -1, item)} className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-wafu-indigo font-bold active-bounce">-</button>
                        <span className="text-xs font-bold text-wafu-indigo font-mono">x{qty}</span>
                        <button onClick={() => updateQuantity(item.id, 1, item)} className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-wafu-indigo font-bold active-bounce">+</button>
                    </div>

                    <div className="mt-3 border-t border-dashed border-stone-100 pt-2">
                        <div className="flex justify-between items-baseline">
                            <span className="text-sm font-bold text-wafu-indigo font-mono">¥{totalPriceYen.toLocaleString()}</span>
                            <span className="text-[10px] text-stone-400 font-mono">≈ NT${totalPriceTwd.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-end mt-2 gap-2">
                            <button onClick={() => openEdit(item)} className="text-stone-300 hover:text-wafu-indigo transition-all duration-100 active-bounce p-1">
                                <Icons.Edit />
                            </button>
                            <button onClick={() => handleDelete(item.id, item)} className="text-stone-300 hover:text-stone-500 transition-all duration-100 active-bounce p-1">
                                <Icons.Trash />
                            </button>
                        </div>
                    </div>
                </div>
                
                {item.bought && (
                    <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-white/10 backdrop-blur-[1px]">
                        <div className="animate-stamp-drop border-2 border-wafu-gold text-wafu-gold rounded font-serif text-lg px-4 py-1 rotate-[-12deg] bg-white/90 shadow-lg tracking-widest uppercase font-bold text-gold-leaf">
                            購入済
                        </div>
                    </div>
                )}
            </div>
           );
        })}
        
        <button 
          onClick={openAdd}
          className="h-auto min-h-[280px] rounded-2xl border border-dashed border-wafu-indigo/20 flex flex-col items-center justify-center text-wafu-indigo/50 gap-3 hover:bg-wafu-indigo/5 hover:border-wafu-indigo/40 transition-all duration-100 active-bounce bg-white/40 font-serif"
        >
          <div className="w-10 h-10 rounded-full bg-wafu-indigo/10 flex items-center justify-center">
            <Icons.Plus />
          </div>
          <span className="font-bold text-xs tracking-widest">追加</span>
        </button>
      </div>

       {deletedItems.length > 0 && (
          <div className="mt-8 px-2">
             <button 
               onClick={() => setShowTrash(!showTrash)}
               className="flex items-center gap-2 text-stone-400 hover:text-wafu-indigo text-xs font-bold uppercase tracking-wider mb-3 transition-colors active-bounce"
             >
                <Icons.Trash />
                <span>已刪除伴手禮 ({deletedItems.length})</span>
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
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl animate-modal-slide-up relative max-h-[85dvh] flex flex-col overflow-hidden">
             
             <div className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-wafu-indigo bg-wafu-indigo rounded-t-2xl shadow-md z-20">
                 <button 
                    onClick={() => setIsAdding(false)} 
                    className="text-white/80 font-bold text-sm hover:text-white transition-colors active-bounce px-2"
                 >
                    取消
                 </button>
                 <h3 className="text-lg font-bold font-serif text-white tracking-widest">
                    {editingId ? '編輯伴手禮' : '伴手禮追加'}
                 </h3>
                 <button 
                    onClick={handleSave}
                    disabled={!newItem.name} 
                    className="bg-white text-wafu-indigo text-sm px-4 py-1.5 rounded-lg font-bold shadow-sm hover:bg-stone-100 disabled:opacity-50 disabled:shadow-none transition-all active-bounce flex items-center gap-2"
                 >
                    儲存
                 </button>
             </div>

             <div className="flex-1 overflow-y-auto px-8 py-8 pb-32 relative bg-white">
                <div className="absolute inset-0 bg-wafu-paper opacity-50 pointer-events-none"></div>
                <div className="relative z-10 space-y-4">
                    <div className="flex gap-4">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 shrink-0 rounded-xl bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:bg-stone-50 overflow-hidden relative active-bounce transition-transform"
                      >
                         {newItem.imageUrl ? (
                           <img src={newItem.imageUrl} className="w-full h-full object-cover" alt="preview" />
                         ) : (
                           <div className="flex flex-col items-center text-stone-400">
                             <Icons.Plus />
                             <span className="text-[9px] mt-1 font-bold">圖片</span>
                           </div>
                         )}
                         <input 
                           type="file" 
                           ref={fileInputRef} 
                           onChange={handleImageUpload} 
                           accept="image/*" 
                           hidden 
                         />
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <input 
                          className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo placeholder:text-stone-300 text-lg font-bold font-serif" 
                          placeholder="商品名稱"
                          value={newItem.name}
                          onChange={e => setNewItem({...newItem, name: e.target.value})}
                          autoFocus
                        />
                         <div className="relative flex gap-2">
                             <div className="relative flex-1">
                                <span className="absolute left-3 top-3 text-stone-400 font-serif text-sm">¥</span>
                                <input 
                                type="number"
                                className="w-full p-3 pl-8 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo font-mono text-base" 
                                placeholder="單價"
                                value={newItem.priceYen || ''}
                                onChange={e => setNewItem({...newItem, priceYen: parseInt(e.target.value) || 0})}
                                />
                             </div>
                             <div className="w-20 relative">
                                <span className="absolute left-2 top-3 text-stone-400 text-xs">x</span>
                                <input 
                                    type="number"
                                    className="w-full p-3 pl-5 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo font-mono text-base"
                                    placeholder="Qty"
                                    value={newItem.quantity}
                                    onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                                />
                             </div>
                          </div>
                      </div>
                    </div>
                    
                    <textarea 
                      className="w-full p-4 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo resize-none h-24 placeholder:text-stone-300 text-base" 
                      placeholder="詳細描述..."
                      value={newItem.description}
                      onChange={e => setNewItem({...newItem, description: e.target.value})}
                    />
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};