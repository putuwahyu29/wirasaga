import React, { useState, useEffect } from 'react';
import { ShieldAlert, Award, ArrowRight, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface GoBagItem {
  id: string;
  name: string;
  category: 'essentials' | 'medical' | 'tools' | 'documents';
  checked: boolean;
  notes?: string;
}

export default function GoBagCalculator() {
  const [familySize, setFamilySize] = useState<number>(() => {
    return parseInt(localStorage.getItem('gobag_family_size') || '1');
  });

  const defaultItems: GoBagItem[] = [
    { id: 'water', name: 'Air Minum Bersih (3 Liter/hari/orang)', category: 'essentials', checked: false },
    { id: 'food', name: 'Makanan Kering / Kaleng Tahan Lama', category: 'essentials', checked: false },
    { id: 'firstaid', name: 'Kotak P3K Lengkat (Perban, Antiseptik, Obat)', category: 'medical', checked: false },
    { id: 'flashlight', name: 'Senter LED & Baterai Cadangan', category: 'tools', checked: false },
    { id: 'powerbank', name: 'Powerbank Cadangan & Kabel Charger', category: 'tools', checked: false },
    { id: 'documents', name: 'Surat Penting dalam Wadah Kedap Air (KK, KTP, Ijazah)', category: 'documents', checked: false },
    { id: 'whistle', name: 'Peluit Logam (Untuk Memanggil Bantuan)', category: 'tools', checked: false },
    { id: 'cash', name: 'Uang Tunai Secukupnya (Pecahan Kecil)', category: 'essentials', checked: false },
    { id: 'clothes', name: 'Pakaian Ganti & Selimut', category: 'essentials', checked: false },
    { id: 'mask', name: 'Masker Kebocoran Asap/Gas', category: 'medical', checked: false }
  ];

  const [items, setItems] = useState<GoBagItem[]>(() => {
    const saved = localStorage.getItem('gobag_checklist_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultItems;
      }
    }
    return defaultItems;
  });

  const [newCustomItem, setNewCustomItem] = useState('');

  // Persist family size
  useEffect(() => {
    localStorage.setItem('gobag_family_size', familySize.toString());
  }, [familySize]);

  // Persist items list
  useEffect(() => {
    localStorage.setItem('gobag_checklist_items', JSON.stringify(items));
  }, [items]);

  const handleToggleItem = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomItem.trim()) return;

    const newItem: GoBagItem = {
      id: `custom-${Date.now()}`,
      name: newCustomItem.trim(),
      category: 'essentials',
      checked: false
    };

    setItems(prev => [...prev, newItem]);
    setNewCustomItem('');
    toast.success('Peralatan khusus berhasil ditambahkan', { position: 'bottom-center' });
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Math metrics based on family size for a 3-day isolation kit
  const waterReqLiters = familySize * 3 * 3; // 3 Liters per person per day for 3 days
  const solidMealsCount = familySize * 3 * 3; // 3 meals per day for 3 days
  const expectedPowerbankMAh = familySize * 10000; // Average 10,000 mAh per person

  // Progress metrics
  const checkedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-transparent w-full relative overflow-hidden p-3 sm:p-5">
      {/* Target icon background badge */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="mb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#AF101A] bg-[#BA1A20]/10 px-2.5 py-1 rounded-full dark:text-red-400 dark:bg-red-500/10">
          Siaga Mitigasi Mandiri
        </span>
        <h3 className="text-xl font-extrabold text-neutral-900 dark:text-zinc-50 mt-3 flex items-center gap-2 font-sans">
          <ShieldAlert className="w-5 h-5 text-primary dark:text-red-500" />
          Checklist Tas Siaga Bencana
        </h3>
        <p className="text-xs text-neutral-600 dark:text-zinc-450 mt-1 font-medium">
          Kaji tingkat kesiapan logistik evakuasi mandiri (TSB) keluarga Anda untuk durasi darurat 3 hari.
        </p>
      </div>

      {/* Multiplier control: Family Size */}
      <div className="bg-neutral-50 dark:bg-zinc-900/60 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-black text-neutral-800 dark:text-neutral-200">
              Jumlah Anggota Keluarga (Orang)
            </label>
            <p className="text-[10px] text-neutral-600 dark:text-neutral-400 mt-0.5 font-bold">
              Volume kebutuhan logistik akan dihitung secara otomatis.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFamilySize(prev => Math.max(1, prev - 1))}
              className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border-2 border-neutral-300 dark:border-zinc-700 flex items-center justify-center font-black text-neutral-800 dark:text-white hover:bg-neutral-100"
            >
              -
            </button>
            <span className="text-xl font-black text-neutral-900 dark:text-white font-mono w-6 text-center">
              {familySize}
            </span>
            <button
              onClick={() => setFamilySize(prev => Math.min(10, prev + 1))}
              className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border-2 border-neutral-300 dark:border-zinc-700 flex items-center justify-center font-black text-neutral-800 dark:text-white hover:bg-neutral-100"
            >
              +
            </button>
          </div>
        </div>

        {/* Calculated Dynamic Demands */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t-2 border-neutral-200 dark:border-neutral-800 text-center">
          <div className="bg-white dark:bg-zinc-800/80 p-2 rounded-xl border border-neutral-200 dark:border-zinc-700">
            <p className="text-[9px] font-black text-neutral-700 dark:text-neutral-300 uppercase">Air Bersih</p>
            <p className="text-base font-black text-primary font-mono mt-0.5">{waterReqLiters} Liter</p>
          </div>
          <div className="bg-white dark:bg-zinc-800/80 p-2 rounded-xl border border-neutral-200 dark:border-zinc-700">
            <p className="text-[9px] font-black text-neutral-700 dark:text-neutral-300 uppercase">Saji Makanan</p>
            <p className="text-base font-black text-primary font-mono mt-0.5">{solidMealsCount} Porsi</p>
          </div>
          <div className="bg-white dark:bg-zinc-800/80 p-2 rounded-xl border border-neutral-200 dark:border-zinc-700">
            <p className="text-[9px] font-black text-neutral-700 dark:text-neutral-300 uppercase">Daya HP</p>
            <p className="text-base font-black text-primary font-mono mt-0.5">{(expectedPowerbankMAh / 1000).toFixed(0)}k mAh</p>
          </div>
        </div>
      </div>

      {/* Progress metrics */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-black text-neutral-800 dark:text-neutral-200">Kelengkapan Tas (TSB)</span>
            <span className="text-xs font-black text-primary font-mono">{progressPercent}% SIAP</span>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-full h-3.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                progressPercent === 100 ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
        
        {progressPercent === 100 && (
          <div className="w-12 h-12 bg-green-100 dark:bg-green-950/40 text-green-600 rounded-full flex items-center justify-center border border-green-200 shrink-0 animate-bounce">
            <Award className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Checklist Grid */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto no-scrollbar pr-1 border-t-2 border-neutral-200 dark:border-neutral-800 pt-4">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => handleToggleItem(item.id)}
            className={`flex items-start justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
              item.checked
                ? 'bg-red-500/5 dark:bg-red-500/10 border-[#AF101A]/30'
                : 'bg-white hover:bg-neutral-50 dark:bg-zinc-900 dark:border-zinc-800/80 border-neutral-200'
            }`}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0 pointer-events-none">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => {}}
                className="mt-1 h-4.5 w-4.5 rounded text-primary focus:ring-primary border-neutral-300 cursor-pointer text-[#AF101A]"
              />
              <span className={`text-xs md:text-sm font-semibold leading-normal ${item.checked ? 'line-through text-neutral-400 dark:text-zinc-500' : 'text-neutral-900 dark:text-white'}`}>
                {item.name}
              </span>
            </div>
            
            {item.id.startsWith('custom-') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(item.id);
                }}
                className="text-neutral-400 hover:text-error transition-colors p-1"
                title="Hapus Alat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Custom item addition */}
      <form onSubmit={handleAddCustomItem} className="flex gap-2 mt-4">
        <input
          type="text"
          value={newCustomItem}
          onChange={(e) => setNewCustomItem(e.target.value)}
          placeholder="Tambah peralatan khusus tambahan..."
          className="flex-1 bg-neutral-100 dark:bg-zinc-900 border-2 border-neutral-300 dark:border-zinc-805 rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none dark:text-white placeholder:text-neutral-400"
        />
        <button
          type="submit"
          className="bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:text-white hover:text-[#AF101A] transition-colors text-neutral-700 p-2 rounded-xl flex items-center justify-center font-black border-2 border-neutral-200 dark:border-zinc-700"
          title="Tambah Peralatan"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
