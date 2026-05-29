import React, { useState } from 'react';
import TermsPrivacyModal from './TermsPrivacyModal';

interface SettingsViewProps {
  onEditProfile: () => void;
  onLogout: () => void;
  profile: any;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

export default function SettingsView({ 
  onEditProfile, 
  onLogout, 
  profile,
  highContrast, 
  setHighContrast,
  largeText, 
  setLargeText,
  theme,
  setTheme
}: SettingsViewProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'terms' | 'privacy'>('terms');

  const handleOpenModal = (type: 'terms' | 'privacy') => {
    setModalType(type);
    setModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-margin-mobile pt-4 space-y-stack-gap-md max-w-lg mx-auto w-full animate-fade-in">
      {/* Page Title */}
      <h1 className="text-headline-md font-headline-md text-on-background dark:text-white mb-2 font-display-md font-extrabold tracking-tight uppercase">Pengaturan</h1>

      {/* Identity Card */}
      <section className="bg-surface-container-lowest dark:bg-zinc-900 rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden border border-outline-variant/30 dark:border-zinc-800 flex flex-col">
        <div className="p-padding-container flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container-high dark:bg-zinc-800 flex-shrink-0 border dark:border-zinc-700">
                <img 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  src={profile.avatar}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhZmFmYWYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTkgMjF2LTJhNCA0IDAgMCAwLTQtNEg5YTQgNCAwIDAgMC00IDR2MiIrPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIvPjwvc3ZnPg==`;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-title-lg font-title-lg text-on-background dark:text-zinc-50 truncate font-sans font-bold">{profile.name}</h2>
                <p className="text-body-md font-body-md text-on-surface-variant dark:text-zinc-400 truncate">{profile.email}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-surface-variant/50 dark:border-zinc-800">
          <button 
            onClick={onEditProfile}
            className="w-full flex items-center justify-between px-padding-container py-4 hover:bg-surface-container-low dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container dark:bg-zinc-800 flex items-center justify-center text-on-surface-variant dark:text-zinc-300 border dark:border-zinc-700">
                <span className="material-symbols-outlined">person</span>
              </div>
              <span className="text-body-lg font-body-lg text-on-background dark:text-zinc-200">Edit Profil</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant dark:text-zinc-400">chevron_right</span>
          </button>
        </div>
      </section>

      {/* Heroic Reputation & Badge Gamification Card */}
      <section className="bg-surface-container-lowest dark:bg-zinc-900 rounded-[24px] border border-outline-variant/30 dark:border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col p-5 gap-4">
        {/* Card Header with Glowing Hero Tag */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary dark:text-red-500 text-lg">military_tech</span>
            <h3 className="text-sm font-black uppercase tracking-wider text-on-surface dark:text-zinc-100 font-sans">
              Reputasi Relawan Heroik
            </h3>
          </div>
          <span className="bg-amber-600 dark:bg-amber-600 text-white font-extrabold text-[8.5px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm animate-pulse flex items-center gap-1">
            <span className="material-symbols-outlined text-[10px] filled">gavel</span>
            SIAGA TANGGUH
          </span>
        </div>

        {/* Hero Rank Banner */}
        <div className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200/50 dark:border-zinc-800/80 p-4 rounded-2xl flex items-center justify-between gap-3 relative overflow-hidden">
          {/* Subtle background graphics */}
          <div className="absolute right-0 bottom-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transform translate-y-3 translate-x-3">
            <span className="material-symbols-outlined text-[120px] select-none font-black text-red-500">award_star</span>
          </div>

          <div className="flex items-center gap-3.5 z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex flex-col items-center justify-center font-sans shadow-md">
              <span className="text-[10px] font-black uppercase tracking-wider leading-none">LV</span>
              <span className="text-xl font-black leading-none mt-0.5">{profile.level || 2}</span>
            </div>
            <div className="text-left">
              <span className="text-[10px] font-black text-neutral-400 dark:text-zinc-500 uppercase tracking-widest block leading-3">
                KUALIFIKASI SAGA
              </span>
              <h4 className="text-sm font-black text-neutral-800 dark:text-white uppercase font-sans mt-0.5">
                {(profile.level || 2) >= 5 ? "Manggala Nusantara" : 
                 (profile.level || 2) >= 4 ? "Saga Utama" : 
                 (profile.level || 2) >= 3 ? "Saga Wicaksana" : 
                 (profile.level || 2) >= 2 ? "Ksatria Siaga" : "Penyelamat Perintis"}
              </h4>
              <p className="text-[10px] text-neutral-500 dark:text-zinc-400 font-medium mt-0.5">
                Respon darurat terpercaya & valid
              </p>
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="flex flex-col gap-1.5 pl-1">
          <div className="flex justify-between items-center text-[10px] font-black tracking-wider">
            <span className="text-neutral-500 dark:text-zinc-400 uppercase">AKUMULASI HERO XP</span>
            <span className="text-primary dark:text-red-400 font-mono">
              {profile.xp || 180} / {(profile.level || 2) * 150} XP
            </span>
          </div>
          <div className="w-full h-3 bg-neutral-200 dark:bg-zinc-805 rounded-full overflow-hidden shadow-inner p-0.5">
            <div 
              style={{ width: `${Math.min(100, ((profile.xp || 180) / ((profile.level || 2) * 150)) * 100)}%` }}
              className="h-full rounded-full bg-amber-600 shadow-inner transition-all duration-700" 
            />
          </div>
        </div>

        {/* Hero Core Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          <div className="bg-neutral-50/70 dark:bg-zinc-950/40 p-3 rounded-xl border border-neutral-200/40 dark:border-zinc-800/65 text-left flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">
              MISI TERTANGANI
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-neutral-800 dark:text-white font-mono">
                {profile.missionsCompleted || 2}
              </span>
              <span className="text-[10.5px] font-bold text-neutral-500 dark:text-zinc-450 uppercase">
                Kasus
              </span>
            </div>
          </div>

          <div className="bg-neutral-50/70 dark:bg-zinc-950/40 p-3 rounded-xl border border-neutral-200/40 dark:border-zinc-800/65 text-left flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">
              KREDIBILITAS VALIDASI
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {profile.reputationScore || 98}%
              </span>
              <span className="text-[10.5px] font-bold text-neutral-500 dark:text-zinc-450 uppercase">
                Akurasi
              </span>
            </div>
          </div>
        </div>

        {/* Lencana Kehormatan Badges Section */}
        <div className="text-left mt-2 border-t border-dashed border-neutral-200 dark:border-zinc-800/80 pt-4">
          <h4 className="text-[10px] font-black text-neutral-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 leading-none">
            <span className="material-symbols-outlined text-[14px]">stars</span>
            LENCANA KEEFEKTIFAN RELAWAN
          </h4>
          
          <div className="grid grid-cols-1 gap-2.5">
            {[
              {
                id: "respon_cepat",
                icon: "bolt",
                title: "Kilat Respon",
                desc: "Merespon pertolongan warga sekitar dalam waktu <5 menit.",
                color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              },
              {
                id: "mitra_siaga",
                icon: "handshake",
                title: "Siaga Pratama",
                desc: "Memiliki profil aktif dan terdaftar di database penolong utama.",
                color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
              },
              {
                id: "pemberantas_hoaks",
                icon: "shield",
                title: "Perisai Kebenaran",
                desc: "Secara proaktif menangani/memverifikasi status sos asli vs palsu.",
                color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20"
              }
            ].map(badge => {
              const hasBadge = (profile.badges || []).includes(badge.id);
              return (
                <div 
                  key={badge.id}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                    hasBadge 
                      ? 'bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 opacity-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]' 
                      : 'bg-neutral-50 dark:bg-zinc-950/20 border-neutral-100 dark:border-zinc-900/50 opacity-40 filter grayscale'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${hasBadge ? badge.color : 'bg-neutral-205 dark:bg-zinc-800 text-neutral-400'}`}>
                    <span className="material-symbols-outlined text-base font-black leading-none">{badge.icon}</span>
                  </div>
                  <div className="min-w-0 pr-1 text-left">
                    <span className="text-[11px] font-black text-neutral-800 dark:text-white uppercase leading-none block">
                      {badge.title}
                    </span>
                    <span className="text-[10px] text-neutral-500 dark:text-zinc-400 font-medium block mt-1 leading-normal">
                      {badge.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Aksesibilitas & Tampilan Section */}
      <section className="bg-surface-container-lowest dark:bg-zinc-900 rounded-[24px] p-0 shadow-[0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden mt-stack-gap-md border border-outline-variant/30 dark:border-zinc-800">
        <h3 className="text-title-md font-title-md text-on-background dark:text-zinc-100 px-padding-container pt-6 pb-2 font-sans font-bold">Aksesibilitas & Tampilan</h3>
        <ul className="flex flex-col">
          <li>
            <div className="w-full flex items-center justify-between px-padding-container py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-container dark:bg-zinc-800 flex items-center justify-center text-on-surface-variant dark:text-zinc-300 border dark:border-zinc-700">
                  <span className="material-symbols-outlined">dark_mode</span>
                </div>
                <span className="text-body-lg font-body-lg text-on-background dark:text-zinc-200">Mode Gelap (Dark Mode)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={theme === 'dark'}
                  onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                />
                <div className="w-11 h-6 bg-surface-container-highest dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:peer-checked:bg-[#AF101A]"></div>
              </label>
            </div>
          </li>
          <li className="border-t border-surface-variant/50 dark:border-zinc-800">
            <div className="w-full flex items-center justify-between px-padding-container py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-container dark:bg-zinc-800 flex items-center justify-center text-on-surface-variant dark:text-zinc-300 border dark:border-zinc-700">
                  <span className="material-symbols-outlined">contrast</span>
                </div>
                <span className="text-body-lg font-body-lg text-on-background dark:text-zinc-200">Kontras Tinggi</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                />
                <div className="w-11 h-6 bg-surface-container-highest dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:peer-checked:bg-[#AF101A]"></div>
              </label>
            </div>
          </li>
          <li className="border-t border-surface-variant/50 dark:border-zinc-800">
            <div className="w-full flex items-center justify-between px-padding-container py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-container dark:bg-zinc-800 flex items-center justify-center text-on-surface-variant dark:text-zinc-300 border dark:border-zinc-700">
                  <span className="material-symbols-outlined">text_fields</span>
                </div>
                <span className="text-body-lg font-body-lg text-on-background dark:text-zinc-200">Teks Besar</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={largeText}
                  onChange={(e) => setLargeText(e.target.checked)}
                />
                <div className="w-11 h-6 bg-surface-container-highest dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:peer-checked:bg-[#AF101A]"></div>
              </label>
            </div>
          </li>
        </ul>
      </section>

      {/* Informasi & Aplikasi Section */}
      <section className="bg-surface-container-lowest dark:bg-zinc-900 rounded-[24px] p-0 shadow-[0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden mt-stack-gap-md border border-outline-variant/30 dark:border-zinc-800 animate-fade-in">
        <h3 className="text-title-md font-title-md text-on-background dark:text-zinc-100 px-padding-container pt-6 pb-2 font-sans font-bold">Informasi & Sinkronisasi</h3>
        <ul className="flex flex-col flex-1">
          <li>
            <button 
              onClick={() => {
                window.dispatchEvent(new Event('trigger-pwa-install'));
              }}
              className="w-full flex items-center justify-between px-padding-container py-4 hover:bg-surface-container-low dark:hover:bg-zinc-800/80 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-650 dark:text-red-400 border border-red-500/25">
                  <span className="material-symbols-outlined">download</span>
                </div>
                <div>
                  <span className="text-body-md font-extrabold text-on-background dark:text-zinc-200 block">Pasang Aplikasi PWA</span>
                  <span className="text-[11px] font-semibold text-on-surface-variant dark:text-zinc-400">Gunakan Wirasaga langsung dari Beranda HP Anda</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant dark:text-zinc-400">chevron_right</span>
            </button>
          </li>
          <li className="border-t border-surface-variant/50 dark:border-zinc-800">
            <div className="w-full flex items-center justify-between px-padding-container py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-container dark:bg-zinc-850 flex items-center justify-center text-on-surface-variant dark:text-zinc-300 border dark:border-zinc-700">
                  <span className="material-symbols-outlined">info</span>
                </div>
                <div>
                  <span className="text-body-md font-extrabold text-on-background dark:text-zinc-200 block">Versi Aplikasi</span>
                  <span className="text-[11px] font-semibold text-on-surface-variant dark:text-zinc-400">v3.2.1-stable (Mendukung Siaga Offline)</span>
                </div>
              </div>
            </div>
          </li>
          <li className="border-t border-surface-variant/50 dark:border-zinc-800">
            <button 
              onClick={() => handleOpenModal('terms')}
              className="w-full flex items-center justify-between px-padding-container py-4 hover:bg-surface-container-low dark:hover:bg-zinc-800/80 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-container dark:bg-zinc-850 flex items-center justify-center text-on-surface-variant dark:text-zinc-300 border dark:border-zinc-700">
                  <span className="material-symbols-outlined">gavel</span>
                </div>
                <div>
                  <span className="text-body-md font-extrabold text-on-background dark:text-zinc-200 block">Ketentuan Layanan</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant dark:text-zinc-400">chevron_right</span>
            </button>
          </li>
          <li className="border-t border-surface-variant/50 dark:border-zinc-800">
            <button 
              onClick={() => handleOpenModal('privacy')}
              className="w-full flex items-center justify-between px-padding-container py-4 hover:bg-surface-container-low dark:hover:bg-zinc-800/80 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-container dark:bg-zinc-850 flex items-center justify-center text-on-surface-variant dark:text-zinc-300 border dark:border-zinc-700">
                  <span className="material-symbols-outlined">policy</span>
                </div>
                <div>
                  <span className="text-body-md font-extrabold text-on-background dark:text-zinc-200 block">Kebijakan Privasi</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant dark:text-zinc-400">chevron_right</span>
            </button>
          </li>
        </ul>
      </section>

      {/* Keluar Section */}
      <section className="mt-stack-gap-md mb-8">
        <button onClick={() => setShowLogoutConfirm(true)} className="w-full bg-error-container dark:bg-red-500/10 text-on-error-container dark:text-red-400 hover:bg-error/20 dark:hover:bg-red-500/20 transition-colors py-4 rounded-xl text-title-md font-title-md flex items-center justify-center gap-2 cursor-pointer font-sans font-bold">
          <span className="material-symbols-outlined">logout</span>
          Keluar
        </button>
      </section>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface dark:bg-zinc-950 border dark:border-zinc-800 rounded-2xl w-full max-w-[320px] overflow-hidden shadow-2xl p-6">
             <div className="w-16 h-16 bg-error-container dark:bg-red-500/10 text-on-error-container dark:text-red-400 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="material-symbols-outlined text-[32px]">logout</span>
             </div>
             <h3 className="text-title-lg font-bold text-center text-on-surface dark:text-white mb-2 font-sans">Yakin Ingin Keluar?</h3>
             <p className="text-body-md text-center text-on-surface-variant dark:text-zinc-400 mb-6">
                Anda perlu masuk kembali untuk menggunakan layanan dan menerima notifikasi darurat.
             </p>
             <div className="flex flex-col gap-3">
               <button 
                  onClick={onLogout}
                  className="w-full bg-error dark:bg-[#AF101A] text-on-error py-3 rounded-xl font-bold hover:bg-error/90 transition-colors cursor-pointer"
               >
                 Ya, Keluar
               </button>
               <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full bg-surface-container-highest dark:bg-zinc-900 text-on-surface dark:text-zinc-200 hover:bg-surface-container-highest/80 dark:hover:bg-zinc-800 py-3 rounded-xl font-bold transition-colors cursor-pointer"
               >
                 Batal
               </button>
             </div>
          </div>
        </div>
      )}

      <TermsPrivacyModal 
        isOpen={modalOpen} 
        type={modalType} 
        onClose={() => setModalOpen(false)} 
      />
    </div>
  );
}
