
import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { Icons } from './Icon';
import { db, sanitizeData } from '../firebase';
// Removed v9 modular imports
import { ExpenseSummary } from './expenses/ExpenseSummary';
import { ExpenseItemCard } from './expenses/ExpenseItemCard';
import { ExpenseForm } from './expenses/ExpenseForm';

interface Props {
  expenses: Expense[];
  currentRate?: number;
  refreshRate?: () => void;
  rateLastUpdated?: Date | null;
  isRateLoading?: boolean;
}

export const ExpenseTracker: React.FC<Props> = ({ 
  expenses, 
  currentRate = 0.22,
  refreshRate,
  rateLastUpdated,
  isRateLoading
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(currentRate);
  
  useEffect(() => {
      setExchangeRate(currentRate);
  }, [currentRate]);

  // Data processing
  const activeExpenses = expenses.filter(ex => !ex.deleted).sort((a,b) => b.date.localeCompare(a.date));
  const deletedExpenses = expenses.filter(ex => ex.deleted);
  const totalYen = activeExpenses.reduce((acc, curr) => acc + curr.amountYen, 0);
  const totalTwd = Math.round(totalYen * exchangeRate);

  // Form Management
  const [formData, setFormData] = useState<Partial<Expense>>({});

  const openAdd = () => {
    setEditingId(null);
    setFormData({});
    setIsAdding(true);
  };

  const handleEdit = (item: Expense) => {
    setEditingId(item.id);
    setFormData(item);
    setIsAdding(true);
  };

  const handleSave = (data: any) => {
    setIsAdding(false);
    (async () => {
        try {
            if (editingId) {
                await db.collection('expenses').doc(editingId).update(sanitizeData(data));
            } else {
                const newId = Date.now().toString();
                await db.collection('expenses').doc(newId).set(sanitizeData({
                    id: newId,
                    ...data,
                    category: 'other',
                    payer: 'Me',
                    deleted: false
                }));
            }
        } catch (err) {
            console.error("Error saving expense:", err);
        }
    })();
  };

  // CRUD Operations
  const handleDelete = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     await db.collection('expenses').doc(id).update({ deleted: true });
  };

  const handleRestore = async (id: string) => {
     await db.collection('expenses').doc(id).update({ deleted: false });
  };

  const handlePermanentDelete = async (id: string) => {
     await db.collection('expenses').doc(id).delete();
  };

  const updateExpenseQuantity = async (id: string, delta: number, expense: Expense) => {
    const currentQty = expense.quantity || 1;
    const newQty = Math.max(1, currentQty + delta);
    const unitPrice = expense.amountYen / currentQty;
    const newTotalYen = unitPrice * newQty;
    try {
        await db.collection('expenses').doc(id).update({ quantity: newQty, amountYen: newTotalYen });
    } catch (err) {
        console.error("Error updating expense quantity:", err);
    }
  };

  return (
    // iOS Adaptive Padding
    <div className="pb-[calc(env(safe-area-inset-bottom)+6rem)] px-5">
      <div className="mb-4 border-b border-wafu-indigo/10 pb-4 mx-1">
        <h2 className="text-3xl font-black font-serif text-wafu-indigo tracking-tight">旅費帳本</h2>
      </div>

      <ExpenseSummary 
        totalYen={totalYen}
        totalTwd={totalTwd}
        exchangeRate={exchangeRate}
        onRateChange={setExchangeRate}
        refreshRate={refreshRate}
        isRateLoading={isRateLoading}
        rateLastUpdated={rateLastUpdated}
      />

      <div className="space-y-3 mb-8">
        {activeExpenses.map(ex => (
          <ExpenseItemCard 
            key={ex.id}
            item={ex}
            exchangeRate={exchangeRate}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onQuantityUpdate={updateExpenseQuantity}
          />
        ))}

        <button 
          onClick={openAdd}
          className="w-full py-4 border border-dashed border-wafu-indigo/20 rounded-2xl text-wafu-indigo/60 flex items-center justify-center gap-2 hover:bg-white hover:border-wafu-indigo/50 hover:text-wafu-indigo transition-all duration-100 active-bounce font-bold tracking-widest bg-white/40 font-serif"
        >
          <Icons.Plus /> 新增支出
        </button>

        {deletedExpenses.length > 0 && (
          <div className="mt-8 px-2">
             <button 
               onClick={() => setShowTrash(!showTrash)}
               className="flex items-center gap-2 text-stone-400 hover:text-wafu-indigo text-xs font-bold uppercase tracking-wider mb-3 transition-colors active-bounce"
             >
                <Icons.Trash />
                <span>已刪除支出 ({deletedExpenses.length})</span>
             </button>
             
             {showTrash && (
               <div className="space-y-3 bg-stone-50/50 p-4 rounded-xl border border-stone-100">
                  {deletedExpenses.map(item => (
                    <div key={item.id} className="flex justify-between items-center opacity-60 hover:opacity-100 transition-opacity gap-2">
                       <span className="text-sm text-stone-500 font-serif truncate flex-1">{item.title}</span>
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

      <ExpenseForm 
        isOpen={isAdding}
        editingId={editingId}
        initialData={formData}
        exchangeRate={exchangeRate}
        onClose={() => setIsAdding(false)}
        onSave={handleSave}
      />
    </div>
  );
};
