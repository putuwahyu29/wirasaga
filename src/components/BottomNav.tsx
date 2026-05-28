import React from 'react';

interface BottomNavProps {
  currentView: 'sos' | 'radar' | 'toolkit' | 'telepon' | 'pengaturan';
  setCurrentView: (view: 'sos' | 'radar' | 'toolkit' | 'telepon' | 'pengaturan') => void;
}

export default function BottomNav({ currentView, setCurrentView }: BottomNavProps) {
  const navItems = [
    { id: 'sos', label: 'SOS', icon: 'emergency' },
    { id: 'radar', label: 'Radar', icon: 'radar' },
    { id: 'toolkit', label: 'Siaga', icon: 'medical_services' },
    { id: 'telepon', label: 'Telepon', icon: 'call' },
    { id: 'pengaturan', label: 'Profil', icon: 'person' }
  ] as const;

  return (
    <div className="w-full flex-shrink-0 z-40 bg-background dark:bg-zinc-950 border-t border-surface-variant/30 dark:border-zinc-800 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] relative">
      <nav className="w-full h-[84px] md:h-24 flex justify-around items-center px-4 md:px-8 pb-safe pt-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center justify-center min-w-[64px] sm:min-w-[72px] transition-all duration-300 relative group flex-1`}
            >
              <div 
                className={`flex items-center justify-center w-16 h-8 sm:h-9 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary-container dark:bg-[#BA1A20]/25 text-on-primary-container dark:text-red-400'
                    : 'text-on-surface-variant dark:text-zinc-400 group-hover:bg-surface-container-highest/50 dark:group-hover:bg-zinc-900'
                }`}
              >
                <span 
                  className="material-symbols-outlined transition-all text-[24px] md:text-[26px]" 
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
              </div>
              <span className={`text-[12px] md:text-[13px] font-medium tracking-wide mt-1.5 transition-all duration-300 ${
                isActive 
                  ? 'text-on-surface dark:text-white font-bold' 
                  : 'text-on-surface-variant dark:text-zinc-400 group-hover:text-on-surface dark:group-hover:text-zinc-200'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
