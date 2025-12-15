
import React, { useState, useEffect } from 'react';
import { ShoppingItem } from '../../types';
import { Icons } from '../Icon';
import { Modal } from '../common/Modal';
import { useImageUpload } from '../../hooks/useImageUpload';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialData: Partial<ShoppingItem>;
  onConfirm: (data: Partial<ShoppingItem>) => void;
}

/**
 * 伴手禮編輯表單
 * 
 * 包含：
 * 1. 圖片上傳/貼上
 * 2. 口味選擇 (甜/鹹) - 用於列表篩選
 * 3. 數量與價格輸入
 */
export const ShoppingForm: React.FC<Props> = ({ isOpen, onClose, title, initialData, onConfirm }) => {
  const [form, setForm] = useState<Partial<ShoppingItem>>(initialData);
  const { fileInputRef, handleImageUpload, triggerUpload, handlePaste, handleClipboardRead } = useImageUpload();

  useEffect(() => {
    if (isOpen) {
        setForm(initialData);
    }
  }, [isOpen, initialData]);

  // 監聽圖片貼上事件
  useEffect(() => {
    if (!isOpen) return;
    const onPaste = (e: ClipboardEvent) => {
        handlePaste(e, (base64) => setForm(prev => ({ ...prev, imageUrl: base64 })));
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [isOpen, handlePaste]);

  return (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        onConfirm={() => onConfirm(form)}
        confirmDisabled={!form.name}
    >
        {/* 圖片上傳區 */}
        <div className="relative w-full mb-6">
            <div 
                onClick={triggerUpload}
                className="w-full h-32 rounded-xl bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:bg-stone-100 overflow-hidden relative active-bounce transition-transform"
            >
                {form.imageUrl ? (
                    <img src={form.imageUrl} className="w-full h-full object-cover" alt="preview" />
                ) : (
                    <div className="flex flex-col items-center text-stone-400">
                        <Icons.Plus />
                        <span className="text-[10px] mt-1 font-bold">商品照片 (可直接貼上)</span>
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => handleImageUpload(e, (base64) => setForm({...form, imageUrl: base64}))} 
                    accept="image/*,image/heic,image/heif" 
                    hidden 
                />
            </div>
            {/* 手機版貼上按鈕 */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    handleClipboardRead((base64) => setForm({...form, imageUrl: base64}));
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
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
            />

            {/* 口味選擇 (Radio Group) */}
            <div className="flex gap-4">
                <label className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all active-bounce
                    ${form.flavor === 'sweet' ? 'bg-pink-50 border-pink-300 text-pink-700' : 'bg-stone-50 border-stone-200 text-stone-400'}`}>
                    <input 
                        type="radio" 
                        name="flavor" 
                        className="hidden" 
                        checked={form.flavor === 'sweet'} 
                        onChange={() => setForm({...form, flavor: 'sweet'})} 
                    />
                    <span className="text-sm font-bold">甜食 🍰</span>
                </label>
                <label className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all active-bounce
                    ${form.flavor === 'salty' ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-stone-50 border-stone-200 text-stone-400'}`}>
                    <input 
                        type="radio" 
                        name="flavor" 
                        className="hidden" 
                        checked={form.flavor === 'salty'} 
                        onChange={() => setForm({...form, flavor: 'salty'})} 
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
                        value={form.priceYen || ''}
                        onChange={e => setForm({...form, priceYen: parseInt(e.target.value) || 0})}
                    />
                </div>
                <div className="w-1/3">
                    <label className="text-[10px] text-stone-400 font-bold uppercase mb-1 block">數量</label>
                    <input 
                        type="number"
                        className="w-full p-3 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo text-lg font-mono font-bold text-center"
                        value={form.quantity}
                        onChange={e => setForm({...form, quantity: Math.max(1, parseInt(e.target.value) || 1)})}
                    />
                </div>
            </div>

            <textarea 
                className="w-full p-4 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-wafu-indigo resize-none h-24 placeholder:text-stone-300 text-base" 
                placeholder="備註..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
            />
        </div>
    </Modal>
  );
};
