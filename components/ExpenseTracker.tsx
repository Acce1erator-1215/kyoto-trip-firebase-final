
import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { Icons } from './Icon';
import { db, sanitizeData } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Modal } from './common/Modal';

interface Props {
  expenses: Expense[];
  currentRate?: number;
  refreshRate?: () => void;
  rateLastUpdated?: Date | null;
  isRateLoading?: boolean;
}

/**
 * 支出紀錄追蹤組件 (Expense Tracker)
 */
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
  
  // 本地匯率狀態
  const [exchangeRate, setExchangeRate] = useState(currentRate);
  
  useEffect(() => {
      setExchangeRate(currentRate);
  }, [currentRate]);

  const [isEditingRate, setIsEditingRate] = useState(false);

  // 表單狀態
  const [amountInput, setAmountInput] = useState<string>('');
  const [title, setTitle] = useState('');
  const [currency, setCurrency] = useState<'JPY' | 'TWD'>('JPY'); 
  const [quantityInput, setQuantityInput] = useState<number>(1);
  const [dateInput, setDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notesInput, setNotesInput] = useState('');
  
  // 計算機狀態
  const [calcYen, setCalcYen] = useState<string>('');
  const [calcTwd, setCalcTwd] = useState<string>('');
  const [lastEdited, setLastEdited] = useState<'yen' | 'twd'>('yen');

  const activeExpenses = expenses.filter(ex => !ex.deleted).sort((a,b) => b.date.localeCompare(a.date));
  const deletedExpenses = expenses.filter(ex => ex.deleted);

  const totalYen = activeExpenses.reduce((acc, curr) => acc + curr.amountYen, 0);
  const totalTwd = Math.round(totalYen * exchangeRate);

  // --- 計算機邏輯 ---
  // 優化：僅在匯率變動時觸發自動計算，避免輸入時的競爭條件 (Race Condition)
  useEffect(() => {
    if (lastEdited === 'yen' && calcYen) {
        const num = parseFloat(calcYen);
        if (!isNaN(num)) setCalcTwd(Math.round(num * exchangeRate).toString());
    } else if (lastEdited === 'twd' && calcTwd) {
        const num = parseFloat(calcTwd);
        if (!isNaN(num)) setCalcYen(Math.round(num / exchangeRate).toString());
    }
  }, [exchangeRate]);

  // 處理日幣輸入變更
  const handleYenChange = (val: string) => {
    setLastEdited('yen');
    setCalcYen(val);
    if (val === '') {
        setCalcTwd(''); // 強制清空另一欄，防止殘留
        return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
        setCalcTwd(Math.round(num * exchangeRate).toString());
    }
  };

  // 處理台幣輸入變更
  const handleTwdChange = (val: string) => {
    setLastEdited('twd');
    setCalcTwd(val);
    if (val === '') {
        setCalcYen(''); // 強制清空另一欄，防止殘留
        return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
        setCalcYen(Math.round(num / exchangeRate).toString());
    }
  };
  
  const openAdd = () => {
    setEditingId(null);
    setTitle('');
    setAmountInput('');
    setQuantityInput(1);
    setCurrency('JPY');
    setDateInput(new Date().toISOString().split('T')[0]);
    setNotesInput('');
    setCalcYen('');
    setCalcTwd('');
    setIsAdding(true);
  };

  const handleEdit = (item: Expense) => {
    setEditingId(item.id);
    setTitle(item.title);
    
    // 反推單價 (使用 parseFloat 確保小數點不遺失)
    const unitPrice = item.amountYen / (item.quantity || 1);
    // 如果是整數顯示整數，小數則保留2位
    const displayPrice = Number.isInteger(unitPrice) ? unitPrice.toString() : unitPrice.toFixed(2);

    setAmountInput(displayPrice);
    setQuantityInput(item.quantity || 1);
    setDateInput(item.date);
    setNotesInput(item.notes || '');
    
    setCurrency('JPY');
    setCalcYen(displayPrice);
    handleYenChange(displayPrice); 
    setLastEdited('yen');

    setIsAdding(true);
  };

  const handleSave = () => {
    if (!amountInput || !title) return;

    // 防呆：如果使用台幣且匯率異常，阻止儲存並提示
    if (currency === 'TWD' && (!exchangeRate || exchangeRate <= 0)) {
        alert("無法獲取有效匯率，請檢查網路或改輸入日幣金額。");
        return;
    }
    
    setIsAdding(false);

    let finalAmountYen = 0;
    // 修復：使用 parseFloat 支援小數點金額
    const inputVal = parseFloat(amountInput);
    if (isNaN(inputVal)) return;

    // 如果輸入的是台幣，先換算回日幣存檔 (系統統一存日幣)
    if (currency === 'TWD') {
        finalAmountYen = inputVal / exchangeRate;
    } else {
        finalAmountYen = inputVal;
    }

    finalAmountYen = finalAmountYen * quantityInput;

    const currentData = {
        title,
        amountYen: finalAmountYen, // Firestore 支援儲存浮點數
        quantity: quantityInput,
        date: dateInput,
        notes: notesInput
    };

    (async () => {
        try {
            if (editingId) {
                await updateDoc(doc(db, 'expenses', editingId), sanitizeData(currentData));
            } else {
                const newId = Date.now().toString();
                await setDoc(doc(db, 'expenses', newId), sanitizeData({
                    id: newId,
                    ...currentData,
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     await updateDoc(doc(db, 'expenses', id), { deleted: true });
  };

  const handleRestore = async (id: string) => {
     await updateDoc(doc(db, 'expenses', id), { deleted: false });
  };

  const handlePermanentDelete = async (id: string) => {
     await deleteDoc(doc(db, 'expenses', id));
  };

  const updateExpenseQuantity = async (id: string, delta: number, expense: Expense) => {
    const currentQty = expense.quantity || 1;
    const newQty = Math.max(1, currentQty + delta);
    
    const unitPrice = expense.amountYen / currentQty;
    const newTotalYen = unitPrice * newQty;

    try {
        await updateDoc(doc(db, 'expenses', id), { 
            quantity: newQty, 
            amountYen: newTotalYen 
        });
    } catch (err) {
        console.error("Error updating expense quantity:", err);
    }
  };

  return (
    <div className="pb-40 px-5">
      <div className="mb-4 border-b border-wafu-indigo/10 pb-4 mx-1">
        <h2 className="text-3xl font-black font-serif text-wafu-indigo tracking-tight">旅費帳本</h2>
      </div>

      {/* 總結卡片 (含可編輯匯率) */}
      <div className="bg-wafu-indigo text-white rounded-2xl p-6 shadow-xl border border-wafu-indigo/50 relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-leaf opacity-10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-wafu-goldLight mb-3 uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2">
                        <Icons.Wallet />
                        <span>總支出統計</span>
                    </h4>
                    
                    {/* 匯率設定：點擊可手動修改 */}
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                            <span className="text-[10px] text-white/60 font-mono">Rate:</span>
                            {isEditingRate ? (
                                <input 
                                    autoFocus
                                    type="number"
                                    className="w-12 bg-transparent text-white text-right text-xs font-mono font-bold focus:outline-none"
                                    value={exchangeRate}
                                    step="0.001"
                                    onChange={e => setExchangeRate(parseFloat(e.target.value) || 0)}
                                    onBlur={() => setIsEditingRate(false)}
                                />
                            ) : (
                                <span 
                                    onClick={() => setIsEditingRate(true)}
                                    className="text-xs font-mono font-bold text-white cursor-pointer border-b border-dashed border-white/40 hover:text-wafu-goldLight"
                                >
                                    {exchangeRate}
                                </span>
                            )}
                            {refreshRate && (
                                <button 
                                    onClick={refreshRate}
                                    className={`ml-1 text-white/60 hover:text-white transition-colors ${isRateLoading ? 'animate-spin' : ''}`}
                                >
                                    <Icons.Refresh className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        {rateLastUpdated && (
                            <span className="text-[8px] text-white/40">
                                Updated: {rateLastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-col items-end">
                <div className="text-4xl font-black font-serif tracking-tight flex items-baseline gap-1">
                    <span className="text-xl font-normal opacity-70">¥</span>
                    <span>{totalYen.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="text-base font-bold text-wafu-goldLight mt-1 font-mono tracking-wide">
                    ≈ NT$ {totalTwd.toLocaleString()}
                </div>
                </div>
            </div>
      </div>

      <div className="space-y-3 mb-8">
        {activeExpenses.map(ex => (
          <div key={ex.id} onClick={(e) => handleEdit(ex)} className="flex flex-col gap-2 bg-white p-4 rounded-2xl shadow-sm border border-stone-100 transition-transform active:scale-[0.98] group hover:border-wafu-indigo/30 relative overflow-hidden animate-zoom-in cursor-pointer">
            <div className="absolute inset-0 bg-wafu-paper opacity-30 pointer-events-none"></div>
            
            <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full border border-stone-200 text-xl flex items-center justify-center text-wafu-indigo font-serif bg-stone-50 shrink-0">
                        ¥
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-stone-700 font-serif text-lg truncate pr-2">{ex.title}</div>
                        <div className="text-xs text-stone-400 mt-0.5 font-mono">{ex.date}</div>
                    </div>
                </div>
                
                <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-wafu-indigo text-lg">¥{ex.amountYen.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="text-xs text-stone-400 mt-0.5 font-medium">≈ NT${Math.round(ex.amountYen * exchangeRate).toLocaleString()}</div>
                </div>
            </div>

            <div className="relative z-10 flex justify-between items-center mt-2 border-t border-stone-100 pt-2">
               <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-lg border border-stone-100" onClick={e => e.stopPropagation()}>
                  <button onClick={() => updateExpenseQuantity(ex.id, -1, ex)} className="text-stone-400 hover:text-wafu-indigo active-bounce w-8 h-8 flex items-center justify-center font-bold text-lg bg-white rounded-md shadow-sm border border-stone-100">-</button>
                  <span className="text-sm font-bold text-wafu-indigo font-mono w-8 text-center">{ex.quantity || 1}</span>
                  <button onClick={() => updateExpenseQuantity(ex.id, 1, ex)} className="text-stone-400 hover:text-wafu-indigo active-bounce w-8 h-8 flex items-center justify-center font-bold text-lg bg-white rounded-md shadow-sm border border-stone-100">+</button>
               </div>
               
               <div className="flex gap-2">
                    <button 
                        onClick={(e) => handleDelete(ex.id, e)}
                        className="text-stone-300 hover:text-red-400 active-bounce p-2"
                    >
                        <Icons.Trash />
                    </button>
               </div>
            </div>
            
            {ex.notes && (
                <div className="relative z-10 text-xs text-stone-500 bg-stone-50 p-2 rounded-lg mt-1">
                    {ex.notes}
                </div>
            )}
          </div>
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
      </div>

      {isAdding && (
        <Modal
          isOpen={isAdding}
          onClose={() => setIsAdding(false)}
          title={editingId ? '編輯支出' : '記帳'}
          onConfirm={handleSave}
          confirmDisabled={!amountInput || !title}
        >
                <div className="relative z-10 space-y-6">
                    
                    {/* 內建模態框的匯率計算機 */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-wafu-darkIndigo to-wafu-indigo rounded-2xl p-4 text-white shadow-inner ring-1 ring-wafu-indigo/50">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}></div>
                        <h3 className="text-[10px] text-wafu-goldLight mb-3 font-bold tracking-[0.2em] uppercase flex justify-between">
                            <span>Calculator</span>
                            <span className="font-serif">換算</span>
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1">
                                <label className="text-[9px] text-white/60 block mb-1 font-bold">JPY</label>
                                <input 
                                    type="number" 
                                    value={calcYen}
                                    onChange={(e) => handleYenChange(e.target.value)}
                                    className="w-full bg-white/10 border border-white/10 rounded-lg p-2 text-lg font-mono focus:outline-none focus:bg-white/20 text-wafu-goldLight font-bold"
                                    placeholder="0"
                                />
                            </div>
                            <div className="text-xl text-wafu-gold opacity-80 pt-4">⇋</div>
                            <div className="flex-1">
                                <label className="text-[9px] text-white/60 block mb-1 font-bold">TWD</label>
                                <input 
                                    type="number" 
                                    value={calcTwd}
                                    onChange={(e) => handleTwdChange(e.target.value)}
                                    className="w-full bg-white/10 border border-white/10 rounded-lg p-2 text-lg font-mono focus:outline-none focus:bg-white/20 text-white font-bold"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <span className="text-[9px] text-white/40 font-mono tracking-wider">Current Rate: {exchangeRate}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3">
                            <input 
                                type="date"
                                value={dateInput}
                                onChange={(e) => setDateInput(e.target.value)}
                                className="w-40 p-3 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-wafu-indigo text-sm font-sans text-stone-600"
                            />
                            <input 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="項目名稱"
                                className="flex-1 min-w-0 p-3 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-wafu-indigo text-base font-serif font-bold"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-1 flex relative">
                                <input 
                                type="number"
                                value={amountInput}
                                onChange={(e) => setAmountInput(e.target.value)}
                                placeholder={currency === 'JPY' ? '¥ 單價' : 'NT$ 單價'}
                                className="w-full min-w-0 p-3 pr-14 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-wafu-indigo font-mono text-lg font-bold"
                                step="any" // 允許小數點輸入
                                />
                                <button 
                                onClick={() => setCurrency(currency === 'JPY' ? 'TWD' : 'JPY')}
                                className="absolute right-1 top-1 bottom-1 px-2 rounded-lg bg-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-300 transition-colors active-bounce"
                                >
                                {currency}
                                </button>
                            </div>
                            
                            {/* 數量步進器 */}
                            <div className="flex items-center bg-stone-50 rounded-xl border border-stone-200 overflow-hidden shrink-0">
                                <button 
                                  onClick={() => setQuantityInput(Math.max(1, quantityInput - 1))}
                                  className="px-3 py-3 text-stone-400 hover:bg-stone-100 hover:text-wafu-indigo active:bg-stone-200 transition-colors font-bold text-xl h-full w-12 flex items-center justify-center"
                                >
                                  -
                                </button>
                                <div className="w-10 text-center font-mono font-bold text-lg text-wafu-indigo border-x border-stone-100 h-full flex items-center justify-center bg-white">
                                  {quantityInput}
                                </div>
                                <button 
                                  onClick={() => setQuantityInput(quantityInput + 1)}
                                  className="px-3 py-3 text-stone-400 hover:bg-stone-100 hover:text-wafu-indigo active:bg-stone-200 transition-colors font-bold text-xl h-full w-12 flex items-center justify-center"
                                >
                                  +
                                </button>
                            </div>
                        </div>

                        <textarea 
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            placeholder="備註..."
                            className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-wafu-indigo h-24 resize-none text-base"
                        />
                    </div>
                </div>
        </Modal>
      )}
    </div>
  );
};
