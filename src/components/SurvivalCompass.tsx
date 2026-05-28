import React, { useState, useEffect } from 'react';
import { Compass, ShieldCheck, Map, CornerRightDown, Navigation, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function SurvivalCompass() {
  const [heading, setHeading] = useState<number>(0);
  const [hasSensor, setHasSensor] = useState<boolean>(false);
  const [lockedHeading, setLockedHeading] = useState<number | null>(null);
  const [manualOffset, setManualOffset] = useState<number>(0);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Use webkitCompassHeading if Safari, else derive from alpha/beta/gamma
      const currentHeading = (e as any).webkitCompassHeading || (360 - (e.alpha || 0));
      if (typeof currentHeading === 'number' && !isNaN(currentHeading)) {
        setHeading(Math.round(currentHeading));
        setHasSensor(true);
      }
    };

    // Request permissions for orientation sensors in iOS devices
    const requestPermission = async () => {
      if (
        typeof window !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        try {
          const authState = await (DeviceOrientationEvent as any).requestPermission();
          if (authState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch (e) {
          console.log('DeviceOrientation permissions not available or rejected');
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const getDirectionName = (deg: number) => {
    const d = (deg % 360 + 360) % 360;
    if (d >= 337.5 || d < 22.5) return 'Utara (N)';
    if (d >= 22.5 && d < 67.5) return 'Timur Laut (NE)';
    if (d >= 67.5 && d < 112.5) return 'Timur (E)';
    if (d >= 112.5 && d < 157.5) return 'Tenggara (SE)';
    if (d >= 157.5 && d < 202.5) return 'Selatan (S)';
    if (d >= 202.5 && d < 247.5) return 'Barat Daya (SW)';
    if (d >= 247.5 && d < 292.5) return 'Barat (W)';
    return 'Barat Laut (NW)';
  };

  const handleLockBearing = () => {
    const targetHeading = hasSensor ? heading : manualOffset;
    if (lockedHeading === null) {
      setLockedHeading(targetHeading);
      toast.info(`Sudut arah dikunci pada ${targetHeading}° (${getDirectionName(targetHeading)}). Jaga arah langkah Anda!`, { position: 'top-center' });
    } else {
      setLockedHeading(null);
    }
  };

  // Rotation style for compass dial ring
  const displayHeading = hasSensor ? heading : manualOffset;
  const rotationStyle = {
    transform: `rotate(${-displayHeading}deg)`,
    transition: 'transform 0.15s ease-out'
  };

  return (
    <div className="bg-transparent w-full p-3 sm:p-5 relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="mb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#AF101A] bg-[#BA1A20]/10 px-2.5 py-1 rounded-full dark:text-red-400 dark:bg-red-500/10">
          Orientasi Navigasi Survival
        </span>
        <h3 className="text-xl font-extrabold text-neutral-900 dark:text-zinc-50 mt-3 flex items-center gap-2 font-sans">
          <Compass className="w-5 h-5 text-primary dark:text-red-500 animate-spin animate-duration-10000" />
          Kompas & Analisis Jalur Evakuasi (ICE)
        </h3>
        <p className="text-xs text-neutral-600 dark:text-zinc-450 mt-1 font-medium">
          Mendeteksi koordinasi arah orientsi manual siber saat listrik mati & internet roboh total. Dapat digunakan dalam model sensor otomatis telepon atau simulasi manual gawai.
        </p>
      </div>

      {/* Interactive Compass Wheel Container */}
      <div className="bg-white dark:bg-zinc-900/60 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 flex flex-col items-center justify-center gap-6">
        
        {/* Dynamic Rotation Graphic Dial */}
        <div className="relative w-48 h-48 bg-neutral-950 rounded-full border-4 border-neutral-300 dark:border-zinc-800 flex items-center justify-center shadow-lg">
          
          {/* Static Heading Pointer (Arrow up) */}
          <div className="absolute top-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-primary z-20 animate-bounce"></div>
          
          {/* Inner Dial Ring */}
          <div 
            className="absolute inset-2 bg-neutral-900 rounded-full border border-neutral-800 flex items-center justify-center text-white" 
            style={rotationStyle}
          >
            {/* Cardinal Markers */}
            <span className="absolute top-2.5 font-sans font-black text-xs text-primary dark:text-red-500">U</span>
            <span className="absolute bottom-2.5 font-sans font-black text-xs text-neutral-400">S</span>
            <span className="absolute right-2.5 font-sans font-black text-xs text-neutral-400">T</span>
            <span className="absolute left-2.5 font-sans font-black text-xs text-neutral-400">B</span>

            {/* Minor angle marks */}
            <span className="absolute top-2.5 right-6 text-[8px] opacity-40">45°</span>
            <span className="absolute bottom-2.5 right-6 text-[8px] opacity-40">135°</span>
            <span className="absolute bottom-2.5 left-6 text-[8px] opacity-40">225°</span>
            <span className="absolute top-2.5 left-6 text-[8px] opacity-40">315°</span>

            {/* Inside Center Ring */}
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-neutral-800 flex items-center justify-center bg-zinc-950">
              <Navigation className="w-6 h-6 text-yellow-400 rotate-45 transform" />
            </div>
          </div>

          {/* Target Locked Marker Overlay */}
          {lockedHeading !== null && (
            <div 
              className="absolute w-1.5 h-16 bg-yellow-400 opacity-65 origin-bottom bottom-1/2 z-10 rounded transition-transform"
              style={{
                transform: `rotate(${lockedHeading - displayHeading}deg)`,
              }}
              title="Arah Terkunci"
            ></div>
          )}
        </div>

        {/* Info Metrics Panels */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-800 p-2.5 rounded-2xl flex flex-col text-center">
            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-wider">Arah Hadap</span>
            <span className="text-lg font-black font-mono text-neutral-900 dark:text-zinc-50 tracking-tight mt-0.5">
              {displayHeading}°
            </span>
            <span className="text-[10px] font-bold text-primary dark:text-red-400 mt-0.5 truncate">
              {getDirectionName(displayHeading)}
            </span>
          </div>

          <div className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-800 p-2.5 rounded-2xl flex flex-col text-center justify-center">
            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-wider">Kunci Sudut (Bearing)</span>
            {lockedHeading !== null ? (
              <>
                <span className="text-xs font-black text-yellow-600 dark:text-yellow-400 font-mono mt-0.5">
                  Locked: {lockedHeading}°
                </span>
                <span className="text-[8px] text-green-600 font-extrabold uppercase mt-0.5">TERKUNCI</span>
              </>
            ) : (
              <span className="text-xs font-bold text-neutral-400 mt-1">Belum Ada Kunci</span>
            )}
          </div>
        </div>

        {/* Simulator controls for standard desktop Chrome / Iframe sandbox without sensors */}
        {!hasSensor && (
          <div className="w-full pt-1.5 border-t border-neutral-100 dark:border-zinc-805">
            <div className="flex justify-between items-center text-[10px] font-black text-neutral-600 dark:text-zinc-400 mb-1.5 uppercase">
              <span>Simulasi Kompas Layar</span>
              <span className="font-mono">{displayHeading}°</span>
            </div>
            <input 
              type="range"
              min="0"
              max="359"
              value={manualOffset}
              onChange={(e) => setManualOffset(parseInt(e.target.value))}
              className="w-full accent-primary bg-neutral-100 dark:bg-zinc-950 h-2 rounded-lg cursor-ew-resize outline-none"
            />
          </div>
        )}

        {/* Lock bearing button */}
        <button
          onClick={handleLockBearing}
          className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all ${
            lockedHeading !== null
              ? 'bg-neutral-800 text-white dark:bg-zinc-100 dark:text-zinc-950'
              : 'bg-primary dark:bg-[#BA1A20] text-white hover:bg-neutral-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          {lockedHeading !== null ? 'LEPAS KUNCI SUDUT' : 'KUNCi ARAH HADAP (LOCK)'}
        </button>

        {/* Location-sharing survival warning */}
        <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-3 text-[10.5px] text-neutral-700 dark:text-zinc-350 flex items-start gap-2 text-left font-medium leading-relaxed">
          <ShieldCheck className="w-4.5 h-4.5 text-green-500 shrink-0 mt-0.5" />
          <span>
            <strong>Panduan Kesiagaan:</strong> Sensor kompas berjalan 100% offline secara lokal. Jika Anda tersesat di sela gempa/hutan, koordinasikan hadap kompas Anda ke tim dispatcher di menu SOS.
          </span>
        </div>

      </div>
    </div>
  );
}
