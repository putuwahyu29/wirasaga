import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RefreshCw, Heart, Info, AlertTriangle } from 'lucide-react';

export default function CPRCompanion() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<'adult' | 'infant'>('adult'); // adult vs infant CPR rules
  const [compressionCount, setCompressionCount] = useState(0);
  const [cycleCount, setCycleCount] = useState(1);
  const [isRescueBreaths, setIsRescueBreaths] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showGuide, setShowGuide] = useState(false);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Constants
  const BPM = mode === 'adult' ? 104 : 110; // 100-120 range
  const intervalMs = (60 / BPM) * 1000;

  // Track session timer
  useEffect(() => {
    if (isPlaying) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPlaying]);

  // Handle metronome cycle
  useEffect(() => {
    if (isPlaying) {
      // Create audio context if not loaded
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const playBeep = () => {
        if (!audioCtxRef.current) return;
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }

        // Generate synthetic beep
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();

        // Higher frequency at the start of sets or breaths to retain focus
        const isFirstBeat = compressionCount === 0;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isFirstBeat ? 1000 : 800, audioCtxRef.current.currentTime);

        gain.gain.setValueAtTime(0.12, audioCtxRef.current.currentTime);
        // Quick decay
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);

        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.1);
      };

      metronomeIntervalRef.current = setInterval(() => {
        if (isRescueBreaths) return; // Freezed while delivering breaths

        playBeep();
        setCompressionCount((prev) => {
          const nextVal = prev + 1;
          const targetLimit = mode === 'adult' ? 30 : 15; // 30 in adult, 15 in child/infant double rescuer

          if (nextVal >= targetLimit) {
            // Pause compressions, switch to Rescue Breaths
            setIsRescueBreaths(true);
            return targetLimit;
          }
          return nextVal;
        });
      }, intervalMs);
    } else {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    }

    return () => {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    };
  }, [isPlaying, isRescueBreaths, compressionCount, mode, intervalMs]);

  // Handle Breaths Cycle Progress
  useEffect(() => {
    let breathTimeout: NodeJS.Timeout;
    if (isRescueBreaths && isPlaying) {
      // Give exactly 5 seconds to perform 2 rescue breaths
      breathTimeout = setTimeout(() => {
        setIsRescueBreaths(false);
        setCompressionCount(0);
        setCycleCount((prev) => prev + 1);
      }, 5000);
    }
    return () => clearTimeout(breathTimeout);
  }, [isRescueBreaths, isPlaying]);

  const handleStartStop = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      // Play brief pulse to prepare
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCompressionCount(0);
    setCycleCount(1);
    setIsRescueBreaths(false);
    setElapsedTime(0);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-transparent w-full relative overflow-hidden p-3 sm:p-5">
      {/* Background aesthetic grid */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#AF101A] bg-[#BA1A20]/10 px-2.5 py-1 rounded-full dark:text-red-400 dark:bg-red-500/10">
            Fitur Kesiapsiagaan CPR
          </span>
          <h3 className="text-xl font-extrabold text-neutral-900 dark:text-zinc-50 mt-3 flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary filled animate-pulse animate-duration-1000" />
            Asisten Metronom CPR
          </h3>
          <p className="text-xs text-neutral-600 dark:text-zinc-450 mt-1 font-medium">
            Penuntun ritme resusitasi jantung & paru secara optimal (AHA Standard)
          </p>
        </div>
        <button
          onClick={() => setShowGuide(!showGuide)}
          aria-label="Toggle CPR tutorial information"
          className="text-neutral-400 hover:text-primary transition-colors p-1"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {showGuide && (
        <div className="mb-4 p-4 bg-red-500/5 border-2 border-[#AF101A]/30 rounded-xl text-xs space-y-2 animate-fade-in text-neutral-800 dark:text-neutral-200">
          <p className="font-extrabold text-neutral-900 dark:text-white flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-primary" /> Panduan Darurat CPR:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1 font-medium">
            <li>Pastikan lingkungan aman sebelum menyentuh korban.</li>
            <li>Panggil bantuan 112 dan aktifkan speaker telepon.</li>
            <li>Baringkan korban di atas permukaan yang keras dan rata.</li>
            <li>Letakkan dua telapak tangan saling bertumpu di tengah dada bawah korban.</li>
            <li>Tekan sedalam 5-6 cm (dewasa) seirama dengan metronom.</li>
            <li>Ratio: lakukan 30 kompresi dada diikuti 2 napas buatan.</li>
          </ol>
        </div>
      )}

      {/* Tabs / Mode Selection */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setMode('adult');
            handleReset();
          }}
          disabled={isPlaying}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${
            mode === 'adult'
              ? 'bg-primary border-primary text-white shadow-sm'
              : 'bg-neutral-50 border-neutral-300 text-neutral-800 hover:bg-neutral-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-neutral-200 disabled:opacity-50'
          }`}
        >
          Dewasa & Remaja (30:2)
        </button>
        <button
          onClick={() => {
            setMode('infant');
            handleReset();
          }}
          disabled={isPlaying}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${
            mode === 'infant'
              ? 'bg-primary border-primary text-white shadow-sm'
              : 'bg-neutral-50 border-neutral-300 text-neutral-800 hover:bg-neutral-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-neutral-200 disabled:opacity-50'
          }`}
        >
          Bayi & Anak-anak (15:2)
        </button>
      </div>

      {/* Monitor Display */}
      <div className="bg-neutral-50 dark:bg-zinc-900/60 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[160px]">
        {isRescueBreaths && isPlaying ? (
          <div className="text-center animate-pulse flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[48px] text-primary">wind_power</span>
            <h4 className="text-lg font-black text-[#AF101A] animate-bounce">
              BERIKAN 2 NAPAS BUATAN!
            </h4>
            <p className="text-xs text-neutral-700 dark:text-neutral-200 font-bold">
              Lakukan dalam waktu 5 detik sebelum siklus baru dimulai kembali.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center relative w-full">
            {/* Pulsating Ring Sync to compression */}
            <div
              className={`absolute rounded-full border border-primary/20 pointer-events-none transition-all duration-100 ${
                isPlaying ? 'animate-ping' : ''
              }`}
              style={{
                width: isPlaying ? '120px' : '0px',
                height: isPlaying ? '120px' : '0px',
                opacity: isPlaying ? 0 : 0.6,
              }}
            ></div>

            <div className="text-5xl font-black text-neutral-900 dark:text-white flex items-center gap-1 font-mono">
              {compressionCount}
              <span className="text-2xl text-neutral-500 font-bold">
                /{mode === 'adult' ? 30 : 15}
              </span>
            </div>
            
            <p className="text-xs font-black text-neutral-600 dark:text-neutral-300 uppercase tracking-widest mt-1">
              Kompresi Dada
            </p>

            <div className="flex gap-6 mt-4 pt-4 border-t-2 border-neutral-200 dark:border-neutral-800 w-full justify-around text-center">
              <div>
                <p className="text-[10px] uppercase font-black text-neutral-500 dark:text-neutral-400">Durasi</p>
                <p className="font-mono text-lg font-black text-neutral-900 dark:text-neutral-100">
                  {formatTime(elapsedTime)}
                </p>
              </div>
              <div className="border-r-2 border-neutral-200 dark:border-neutral-800"></div>
              <div>
                <p className="text-[10px] uppercase font-black text-neutral-500 dark:text-neutral-400">Siklus</p>
                <p className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                  #{cycleCount}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleStartStop}
          className={`flex-[2] py-3.5 rounded-xl font-black flex items-center justify-center gap-2 text-xs transition-all shadow-sm cursor-pointer ${
            isPlaying
              ? 'bg-neutral-900 text-white hover:bg-black dark:bg-white dark:text-neutral-900'
              : 'bg-primary text-white hover:bg-[#930005]'
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="w-4 h-4 text-white dark:text-neutral-900" />
              Hentikan Metronom
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-white" />
              Mulai Metronom ({BPM} BPM)
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="flex-1 py-3.5 rounded-xl border-2 border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-neutral-200 font-bold flex items-center justify-center gap-1.5 transition-colors"
          title="Reset Siklus"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
}
