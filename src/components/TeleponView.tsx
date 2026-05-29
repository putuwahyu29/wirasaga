import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

interface ICEContact {
  id: string;
  name: string;
  phone: string;
  type: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  toast.error(`Akses Database Ditolak: ${errInfo.error}`, { position: 'top-center' });
}

export default function TeleponView() {
  const tabs = ['Semua', 'Medis', 'Keamanan', 'Pemadam', 'Mekanik'] as const;
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Semua');
  const [iceContacts, setIceContacts] = useState<ICEContact[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', type: 'Keluarga' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'ice_contacts'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contactsData: ICEContact[] = [];
      snapshot.forEach((doc) => {
        contactsData.push({ id: doc.id, ...doc.data() } as ICEContact);
      });
      setIceContacts(contactsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ice_contacts');
    });
    return () => unsubscribe();
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    // Explicit Validation
    if (!newContact.name || newContact.name.length < 3) {
      toast.error('Nama kontak minimal 3 karakter', { position: 'top-center' });
      return;
    }
    
    const phoneRegex = /^[0-9+]{8,15}$/;
    if (!newContact.phone || !phoneRegex.test(newContact.phone)) {
      toast.error('Nomor telepon tidak valid (8-15 digit angka)', { position: 'top-center' });
      return;
    }

    try {
      await addDoc(collection(db, 'ice_contacts'), {
        ...newContact,
        userId: auth.currentUser.uid,
        createdAt: new Date()
      });
      setShowAddModal(false);
      setNewContact({ name: '', phone: '', type: 'Keluarga' });
      toast.success('Kontak berhasil ditambahkan', { position: 'top-center' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'ice_contacts');
    }
  };

  const handleDeleteContact = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'ice_contacts', id));
      toast.success('Kontak dihapus', { position: 'top-center' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `ice_contacts/${id}`);
    }
  };

  const allQuickContacts = [
    { name: 'Polisi (Polri)', desc: 'Polsek Terdekat', icon: 'local_police', color: 'text-on-surface-variant', bg: 'bg-surface-container-highest', phone: '110', type: 'Keamanan' },
    { name: 'Ambulans (RSUD)', desc: 'RSUD Kota', icon: 'local_hospital', color: 'text-primary', bg: 'bg-primary/10', phone: '119', type: 'Medis' },
    { name: 'Pemadam Kebakaran', desc: 'Pos Damkar Pusat', icon: 'fire_truck', color: 'text-on-surface-variant', bg: 'bg-surface-container-highest', phone: '113', type: 'Pemadam' },
    { name: 'Basarnas (SAR)', desc: 'Pencarian & Pertolongan', icon: 'support', color: 'text-error', bg: 'bg-error/10', phone: '115', type: 'Keamanan' },
    { name: 'PLN (Listrik)', desc: 'Gangguan Listrik', icon: 'electric_bolt', color: 'text-tertiary', bg: 'bg-tertiary/10', phone: '123', type: 'Mekanik' },
  ];

  const quickContacts = allQuickContacts.filter(c => {
    if (activeTab !== 'Semua' && c.type !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.desc.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredIceContacts = iceContacts.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.phone.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 px-margin-mobile pt-4 max-w-lg mx-auto w-full animate-fade-in pb-32">
      {/* Search Bar */}
      <div className="w-full">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <span className="material-symbols-outlined text-on-surface-variant dark:text-zinc-400">search</span>
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kontak..." 
            className="w-full h-14 bg-surface-container-lowest dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-full pl-12 pr-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] text-body-lg font-body-lg text-on-surface dark:text-white focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant/60 dark:placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* 112 Nasional Prominent Card */}
      <section className="flex flex-col gap-4">
        <div className="bg-primary rounded-[1.5rem] p-6 relative overflow-hidden shadow-[0_8px_24px_rgba(175,16,26,0.25)] flex flex-col justify-between min-h-[180px]">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-black/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-label-lg font-label-lg text-primary-fixed-dim uppercase tracking-widest mb-1">Nasional</span>
              <h3 className="text-display-lg font-display-lg text-on-primary m-0 leading-none">112</h3>
              <p className="text-body-md font-body-md text-on-primary/90 mt-2 max-w-[200px]">Pusat Panggilan Darurat Terpadu Indonesia.</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
              <span className="material-symbols-outlined filled text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>local_police</span>
            </div>
          </div>
          
          <div className="relative z-10 mt-6">
            <button 
              onClick={() => window.location.href = 'tel:112'}
              className="w-full bg-on-primary text-primary font-title-md text-title-md py-4 px-6 rounded-full flex items-center justify-center gap-3 hover:bg-surface-bright transition-transform active:scale-[0.98] shadow-[0_1px_3px_1px_rgba(0,0,0,0.15)]"
            >
              <span className="material-symbols-outlined filled" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
              Hubungi 112 Sekarang
            </button>
          </div>
        </div>
      </section>

      {/* Category Chips */}
      <section className="-mx-margin-mobile px-margin-mobile">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-1">
          {tabs.map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-4 h-8 rounded-lg border text-label-lg font-label-lg transition-colors flex items-center justify-center cursor-pointer
                ${activeTab === tab 
                  ? 'bg-primary border-primary text-on-primary' 
                  : 'bg-surface-container-lowest dark:bg-zinc-900 border-outline dark:border-zinc-800 text-on-surface dark:text-zinc-350 hover:bg-surface-container-low dark:hover:bg-zinc-800'}`}
            >
              {tab}
            </button>
          ))}
          <div className="w-2 shrink-0"></div>
        </div>
      </section>

      {/* Kontak Bantuan List */}
      <section className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] p-4">
        <h3 className="text-title-lg font-title-lg text-on-surface dark:text-white mb-4 px-2 font-sans">Kontak Bantuan ({activeTab})</h3>
        <div className="flex flex-col">
          {quickContacts.map((contact, idx) => (
            <React.Fragment key={idx}>
              <div 
                onClick={() => window.location.href = `tel:${contact.phone}`}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-container-low dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4 pointer-events-none">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${contact.bg}`}>
                     <span className={`material-symbols-outlined filled ${contact.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{contact.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-title-md font-title-md text-on-surface dark:text-zinc-150">{contact.name}</span>
                    <span className="text-label-md font-label-md text-on-surface-variant dark:text-zinc-400">{contact.desc}</span>
                  </div>
                </div>
                <button aria-label={`Telepon ${contact.name}`} className="w-10 h-10 rounded-full border border-outline-variant dark:border-zinc-700 flex items-center justify-center text-primary dark:text-[#BA1A20] group-hover:bg-primary-container/10 transition-colors pointer-events-none">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>call</span>
                </button>
              </div>
              {idx < quickContacts.length - 1 && <hr className="border-outline-variant/30 dark:border-zinc-800/40 my-2 mx-12 pointer-events-none" />}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Kontak Darurat Pribadi (ICE) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-title-lg font-title-lg text-on-surface dark:text-zinc-50 font-sans">Kontak Darurat (ICE)</h2>
          <span className="bg-surface-container-high dark:bg-zinc-800 text-on-surface-variant dark:text-zinc-300 text-label-md font-label-md px-2 py-1 rounded-md">{filteredIceContacts.length} Tersimpan</span>
        </div>
        <p className="text-body-md font-body-md text-on-surface-variant dark:text-zinc-400 -mt-2">Orang terdekat yang akan dihubungi jika terjadi keadaan darurat.</p>
        
        <div className="flex flex-col gap-3 mt-2">
          {filteredIceContacts.map((contact) => (
            <div key={contact.id} className="bg-surface-container-lowest dark:bg-zinc-900 shadow-[0_4px_16px_rgba(0,0,0,0.04)] rounded-xl p-4 flex items-center justify-between border border-outline-variant/30 dark:border-zinc-800 transition-colors hover:bg-surface-container-low dark:hover:bg-zinc-850 group cursor-pointer" onClick={() => window.location.href = `tel:${contact.phone}`}>
              <div className="flex items-center gap-4 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-secondary-container dark:bg-zinc-800 flex items-center justify-center text-on-secondary-container dark:text-zinc-300">
                  <span className="text-title-lg font-title-lg font-bold">{contact.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-title-md font-title-md text-on-surface dark:text-zinc-100">{contact.name}</span>
                  <span className="text-body-md font-body-md text-on-surface-variant dark:text-zinc-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">family_restroom</span>
                    {contact.type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => handleDeleteContact(e, contact.id)} className="w-12 h-12 rounded-full bg-surface-container dark:bg-zinc-800 text-error flex items-center justify-center hover:bg-error-container dark:hover:bg-red-900/30 transition-colors focus:ring-2 cursor-pointer">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                </button>
                <button aria-label={`Telepon ${contact.name}`} className="w-12 h-12 rounded-full bg-surface-container-high dark:bg-zinc-800 text-primary dark:text-[#BA1A20] flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition-colors focus:ring-2 pointer-events-none">
                  <span className="material-symbols-outlined filled" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={() => setShowAddModal(true)}
            className="mt-2 w-full bg-transparent border-2 border-dashed border-outline-variant dark:border-zinc-800 hover:border-primary dark:hover:border-red-700 hover:bg-primary/5 text-on-surface-variant dark:text-zinc-400 hover:text-primary dark:hover:text-red-400 text-title-md font-title-md py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined">person_add</span>
            Tambah Kontak ICE
          </button>
        </div>
      </section>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface dark:bg-zinc-950 border dark:border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-outline/20 flex justify-between items-center">
              <h3 className="text-title-lg font-title-lg text-on-surface dark:text-zinc-50 font-sans">Tambah Kontak ICE</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant dark:text-zinc-400 hover:bg-surface-container dark:hover:bg-zinc-800 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleAddContact} className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-label-md text-on-surface-variant dark:text-zinc-400 ml-1">Nama</label>
                <div className="bg-surface-container dark:bg-zinc-900 rounded-xl overflow-hidden flex items-center px-4 border border-outline/20 dark:border-zinc-800 focus-within:border-primary focus-within:ring-1">
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-zinc-400 mr-3 text-[20px]">person</span>
                  <input 
                    type="text" 
                    required
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    placeholder="Nama Kontak" 
                    className="w-full bg-transparent border-none focus:ring-0 text-body-lg py-3 outline-none text-on-surface dark:text-white" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-label-md text-[#AF101A] dark:text-red-400 ml-1">Nomor Telepon</label>
                <div className="bg-surface-container dark:bg-zinc-900 rounded-xl overflow-hidden flex items-center px-4 border border-outline/20 dark:border-zinc-800 focus-within:border-primary focus-within:ring-1">
                  <span className="material-symbols-outlined text-[#AF101A] dark:text-red-400 mr-3 text-[20px]">call</span>
                  <input 
                    type="tel" 
                    required
                    value={newContact.phone}
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                    placeholder="Nomor Telepon" 
                    className="w-full bg-transparent border-none focus:ring-0 text-body-lg py-3 outline-none text-[#AF101A] dark:text-red-400 font-bold" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-label-md text-on-surface-variant dark:text-zinc-400 ml-1">Hubungan</label>
                <div className="bg-surface-container dark:bg-zinc-900 rounded-xl overflow-hidden flex items-center px-4 border border-outline/20 dark:border-zinc-800 focus-within:border-primary focus-within:ring-1">
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-zinc-400 mr-3 text-[20px]">group</span>
                  <select 
                    value={newContact.type}
                    onChange={(e) => setNewContact({...newContact, type: e.target.value})}
                    className="w-full bg-transparent border-none focus:ring-0 text-body-lg py-3 outline-none text-on-surface dark:text-white appearance-none cursor-pointer" 
                  >
                    <option value="Keluarga" className="bg-white dark:bg-zinc-900 text-on-surface dark:text-white">Keluarga</option>
                    <option value="Teman" className="bg-white dark:bg-zinc-900 text-on-surface dark:text-white">Teman</option>
                    <option value="Pasangan" className="bg-white dark:bg-zinc-900 text-on-surface dark:text-white">Pasangan</option>
                    <option value="Lainnya" className="bg-white dark:bg-zinc-900 text-on-surface dark:text-white">Lainnya</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={!newContact.name || !newContact.phone}
                className="mt-2 bg-primary text-on-primary py-3 rounded-full font-title-md transition-all active:scale-95 flex items-center justify-center shadow-md disabled:opacity-75 disabled:active:scale-100 w-full cursor-pointer"
              >
                Simpan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
