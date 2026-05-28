import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// Global variable to capture prompt if it fires before mounting
let stashedPromptEvent: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    stashedPromptEvent = e;
  });
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    // 2. Manage stashed prompt or set listener
    if (stashedPromptEvent) {
      setDeferredPrompt(stashedPromptEvent);
      
      const isDismissed = sessionStorage.getItem('pwa-install-prompt-dismissed');
      if (!isDismissed) {
        // Delay slightly for natural entrance feeling
        const timer = setTimeout(() => setIsVisible(true), 2500);
        return () => clearTimeout(timer);
      }
    }

    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      stashedPromptEvent = e;
      setDeferredPrompt(e);
      
      const isDismissed = sessionStorage.getItem('pwa-install-prompt-dismissed');
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);

    // 3. Handle iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isAppleDevice) {
      setIsIos(true);
      const isDismissed = sessionStorage.getItem('pwa-install-prompt-dismissed');
      if (!isDismissed) {
        const timer = setTimeout(() => setIsVisible(true), 3500);
        return () => clearTimeout(timer);
      }
    }

    // Check if user manually clicked install somewhere in settings
    const handleTriggerManual = () => {
      setIsVisible(true);
    };
    window.addEventListener('trigger-pwa-install', handleTriggerManual);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
      window.removeEventListener('trigger-pwa-install', handleTriggerManual);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    
    // Show Chrome prompt
    deferredPrompt.prompt();
    
    // Check results
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Prompt choice: ${outcome}`);
    
    // Reset stashes
    setDeferredPrompt(null);
    stashedPromptEvent = null;
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Persist rejection in session state to prevent nagging
    sessionStorage.setItem('pwa-install-prompt-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-x-0 bottom-0 z-[100] p-4 flex justify-center pointer-events-none md:bottom-6">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] overflow-hidden pointer-events-auto flex flex-col p-5"
          >
            {/* Header / Brand */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 dark:bg-red-500/20 flex-shrink-0 flex items-center justify-center border border-red-500/20">
                <img 
                  src="/logo.svg" 
                  alt="Wirasaga Logo" 
                  className="w-8 h-8 object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback visually if logo fails to render
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallbackIcon = document.createElement('span');
                      fallbackIcon.className = 'material-symbols-outlined text-red-600 dark:text-red-400 text-2xl';
                      fallbackIcon.innerText = 'emergency';
                      parent.appendChild(fallbackIcon);
                    }
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-neutral-900 dark:text-zinc-100 font-sans tracking-tight uppercase">
                    Pasang Wirasaga
                  </h4>
                  <button 
                    onClick={handleDismiss}
                    className="p-1 -mr-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-300"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
                <p className="text-xs text-neutral-500 dark:text-zinc-450 mt-1.5 leading-relaxed font-semibold">
                  Akses Wirasaga super cepat langsung dari Beranda HP Anda. Mendukung pemantauan radar offline dan notifikasi darurat.
                </p>
              </div>
            </div>

            {/* Custom Content based on device configuration */}
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-zinc-805">
              {isIos ? (
                /* iOS Specific instructions */
                <div className="bg-neutral-50 dark:bg-zinc-950 p-3 rounded-xl border border-neutral-100 dark:border-zinc-900">
                  <p className="text-[11px] text-neutral-600 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                    Sistem iOS terdeteksi:
                  </p>
                  <ol className="list-decimal list-inside text-[11px] text-neutral-500 dark:text-zinc-450 mt-1.5 space-y-1.5 pl-0.5 font-medium">
                    <li>
                      Ketuk tombol <strong className="text-neutral-800 dark:text-zinc-200">Bagikan</strong> ( <span className="align-middle inline-flex items-center justify-center p-0.5 border border-neutral-200 rounded text-neutral-700 bg-white text-[13px] font-sans">
                        <span className="material-symbols-outlined text-xs">share</span>
                      </span> ) di baris menu bawah browser Safari Anda.
                    </li>
                    <li>
                      Gulir ke bawah lalu ketuk <strong className="text-neutral-800 dark:text-zinc-200">Tambahkan ke Layar Utama</strong> ( <span className="align-middle inline-flex items-center justify-center p-0.5 border border-neutral-200 rounded text-neutral-700 bg-white text-[13px] font-sans">
                        <span className="material-symbols-outlined text-xs">add_box</span>
                      </span> ).
                    </li>
                  </ol>
                  <button
                    onClick={handleDismiss}
                    className="w-full mt-3 py-1.5 text-center bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-300 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Saya Mengerti
                  </button>
                </div>
              ) : (
                /* Standard Android/Chrome Install Buttons */
                <div className="flex gap-2.5 items-center justify-end">
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 hover:bg-neutral-100 dark:hover:bg-zinc-850 text-neutral-600 dark:text-zinc-400 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Nanti Saja
                  </button>
                  <button
                    onClick={handleInstallClick}
                    disabled={!deferredPrompt}
                    className="px-5 py-2.5 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer animate-pulse-subtle"
                  >
                    <span className="material-symbols-outlined text-[15px]">download</span>
                    Pasang Sekarang
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
