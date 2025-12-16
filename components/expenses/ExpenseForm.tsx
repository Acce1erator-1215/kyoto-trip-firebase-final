
import React, { useState, useEffect } from 'react';
import { Expense, CATEGORIES, Category } from '../../types';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';

// 表單資料介面定義
interface ExpenseFormData {
    title: string;
    amountYen: number;
    quantity: number;
    date: string;
    notes: string;
    category: string;
}

interface Props {
  isOpen: boolean;
  editingId: string | null; 
  initialData: Partial<Expense>;
  exchangeRate: number; 
  onClose: () => void;
  onSave: (data: ExpenseFormData) => void;
}

export const ExpenseForm: React.FC<Props> = ({ 
    isOpen, 
    editingId, 
    initialData, 
    exchangeRate, 
    onClose, 
    onSave 
}) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [amountInput, setAmountInput] = useState<string>(''); 
  const [currency, setCurrency] = useState<'JPY' | 'TWD'>('JPY'); 
  const [quantityInput, setQuantityInput] = useState<number>(1);
  const [dateInput, setDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notesInput, setNotesInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | string>('other');

  const [calcYen, setCalcYen] = useState<string>('');
  const [calcTwd, setCalcTwd] = useState<string>('');
  const [lastEdited, setLastEdited] = useState<'yen' | 'twd'>('yen'); 

  useEffect(() => {
    if (isOpen) {
        setTitle(initialData.title || '');
        setQuantityInput(initialData.quantity || 1);
        setDateInput(initialData.date || new Date().toISOString().split('T')[0]);
        setNotesInput(initialData.notes || '');
        setSelectedCategory(initialData.category || 'other');
        setCurrency('JPY');

        if (initialData.amountYen) {
            const unitPrice = initialData.amountYen / (initialData.quantity || 1);
            const displayPrice = Number.isInteger(unitPrice) ? unitPrice.toString() : unitPrice.toFixed(2);
            setAmountInput(displayPrice);
            setCalcYen(displayPrice);
            
            const num = parseFloat(displayPrice);
            if (!isNaN(num)) setCalcTwd(Math.round(num * exchangeRate).toString());
        } else {
            setAmountInput('');
            setCalcYen('');
            setCalcTwd('');
        }
    } else {
        setCalcYen('');
        setCalcTwd('');
        setAmountInput('');
    }
  }, [isOpen, initialData, exchangeRate]);

  useEffect(() => {
    if (lastEdited === 'yen' && calcYen) {
        const num = parseFloat(calcYen);
        if (!isNaN(num)) setCalcTwd(Math.round(num * exchangeRate).toString());
    } else if (lastEdited === 'twd' && calcTwd) {
        const num = parseFloat(calcTwd);
        if (!isNaN(num)) setCalcYen(Math.round(num / exchangeRate).toString());
    }
  }, [exchangeRate, calcYen, calcTwd, lastEdited]);

  const handleYenChange = (val: string) => {
    setLastEdited('yen');
    setCalcYen(val);
    if (val === '') { setCalcTwd(''); return; }
    const num = parseFloat(val);
    if (!isNaN(num)) { setCalcTwd(Math.round(num * exchangeRate).toString()); }
  };

  const handleTwdChange = (val: string) => {
    setLastEdited('twd');
    setCalcTwd(val);
    if (val === '') { setCalcYen(''); return; }
    const num = parseFloat(val);
    if (!isNaN(num)) { setCalcYen(Math.round(num / exchangeRate).toString()); }
  };

  const handleConfirm = () => {
    if (!amountInput || !title) return;

    if (currency === 'TWD' && (!exchangeRate || exchangeRate <= 0)) {
        showToast("無法獲取有效匯率，請改輸入日幣", "error");
        return;
    }

    const inputVal = parseFloat(amountInput);
    if (isNaN(inputVal)) return;

    let finalAmountYen = inputVal;
    if (currency === 'TWD') {
        finalAmountYen = inputVal / exchangeRate;
    }

    finalAmountYen = finalAmountYen * quantityInput;

    onSave({
        title,
        amountYen: finalAmountYen,
        quantity: quantityInput,
        date: dateInput,
        notes: notesInput,
        category: selectedCategory
    });
  };

  return (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editingId ? '編輯支出' : '記帳'}
        onConfirm={handleConfirm}
        confirmDisabled={!amountInput || !title}
    >
        <div className="relative z-10 space-y-6">
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
                    <span className="text-[9px] text-white/40 font-mono tracking-wider">Current Rate: {exchangeRate.toFixed(3)}</span>
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
                            step="any" 
                        />
                        <button 
                            onClick={() => setCurrency(currency === 'JPY' ? 'TWD' : 'JPY')}
                            className="absolute right-1 top-1 bottom-1 px-2 rounded-lg bg-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-300 transition-colors active-bounce"
                        >
                            {currency}
                        </button>
                    </div>
                    
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

                <div>
                    <label className="text-[10px] text-stone-400 font-bold uppercase mb-2 block">類別</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {Object.entries(CATEGORIES).map(([key, val]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedCategory(key)}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-95 ${selectedCategory === key ? 'bg-wafu-indigo text-white border-wafu-indigo shadow-md' : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-wafu-indigo/30'}`}
                            >
                                <span className="text-xl mb-1">{val.icon}</span>
                                <span className="text-[10px] font-bold">{val.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <textarea 
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="備註..."
                    className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-wafu-indigo h-20 resize-none text-base"
                />
            </div>
        </div>
    </Modal>
  );
};
