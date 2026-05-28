import React from 'react';
import { toast } from 'sonner';

interface HeaderProps {
  onProfileClick?: () => void;
  avatar?: string;
}

export default function Header({ onProfileClick, avatar }: HeaderProps) {
  const handleNotifClick = () => {
    toast.info("Tidak ada notifikasi darurat baru saat ini.", {
      position: 'top-center'
    });
  };

  return (
    <header className="bg-background dark:bg-zinc-950 text-on-background dark:text-zinc-50 flex-shrink-0 z-40 w-full sticky top-0 border-b border-surface-variant/30 dark:border-zinc-800">
      <div className="w-full flex justify-between items-center px-4 sm:px-6 py-3 h-16 md:h-20 transition-all">
        <div className="flex items-center gap-2">
          {/* Official branding logo */}
          <img 
            src="/logo.svg" 
            alt="Wirasaga Logo" 
            className="w-8 h-8 md:w-10 md:h-10 rounded-lg shadow-sm object-cover"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-title-lg md:text-headline-sm font-bold text-primary dark:text-red-500 tracking-tight">Wirasaga</h1>
        </div>
        
        <div className="flex items-center gap-3 md:gap-5">
          <button 
            onClick={handleNotifClick}
            className="relative p-2 rounded-full hover:bg-surface-container-low dark:hover:bg-zinc-900 transition-colors text-on-surface-variant dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <span className="material-symbols-outlined text-[24px] md:text-[26px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-[2px] border-background dark:border-zinc-950"></span>
          </button>
          
          <button 
            onClick={onProfileClick}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-secondary-container dark:bg-zinc-800 flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity border border-outline-variant dark:border-zinc-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-secondary-container dark:text-zinc-200"
          >
            {avatar ? (
              <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[20px] md:text-[22px]">person</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
