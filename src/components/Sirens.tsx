import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Radio } from "lucide-react";

export default function Sirens() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [oscillator1, setOscillator1] = useState<OscillatorNode | null>(null);
  const [oscillator2, setOscillator2] = useState<OscillatorNode | null>(null);
  const [gainNode, setGainNode] = useState<GainNode | null>(null);

  const startSiren = () => {
    try {
      // 1. Create or resume AudioContext
      const ctx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtx) setAudioCtx(ctx);

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // 2. Setup standard oscillating dual-tone sirens
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "sine";

      // Setup sweeping siren sound (dual oscillator frequency sweep loop)
      osc1.frequency.setValueAtTime(450, ctx.currentTime);
      osc2.frequency.setValueAtTime(600, ctx.currentTime);

      // Low frequency oscillator (LFO) to sweep the main pitch
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 1.8; // Sweep twice per second
      lfoGain.gain.value = 120;  // Pitch sweep range ±120Hz

      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      gain.gain.setValueAtTime(0.08, ctx.currentTime); // Low volume initially to be pleasant but clear

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      // Start sound
      osc1.start();
      osc2.start();
      lfo.start();

      setOscillator1(osc1);
      setOscillator2(osc2);
      setGainNode(gain);
      setIsPlaying(true);
    } catch (err) {
      console.error("Sirens Sound Engine initialization failed:", err);
    }
  };

  const stopSiren = () => {
    if (oscillator1) {
      try {
        oscillator1.stop();
      } catch (e) {}
      setOscillator1(null);
    }
    if (oscillator2) {
      try {
        oscillator2.stop();
      } catch (e) {}
      setOscillator2(null);
    }
    if (gainNode) {
      try {
        gainNode.disconnect();
      } catch (e) {}
      setGainNode(null);
    }
    setIsPlaying(false);
  };

  const handleToggleSiren = () => {
    if (isPlaying) {
      stopSiren();
    } else {
      startSiren();
    }
  };

  // Clean up on component unmount to prevent audio leaks
  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopSiren();
      }
    };
  }, [isPlaying, oscillator1, oscillator2]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl shadow-sm flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl flex items-center justify-center ${isPlaying ? "bg-red-100 dark:bg-red-950/40 text-primary dark:text-red-400 animate-bounce" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"}`}>
          <Radio className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-100 leading-tight">
            Sirine Darurat Lokal
          </h4>
          <p className="text-[10px] text-gray-400 dark:text-zinc-400 mt-0.5">
            {isPlaying ? "Alarm pencarian/panggilan aktif" : "Bunyikan untuk panggil bantuan sekitar"}
          </p>
        </div>
      </div>
 
      <button
        onClick={handleToggleSiren}
        className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 duration-150 flex items-center gap-1.5 cursor-pointer ${
          isPlaying
            ? "bg-primary text-white hover:bg-red-700"
            : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700"
        }`}
        title={isPlaying ? "Matikan Sirine" : "Bunyikan Sirine"}
      >
        {isPlaying ? (
          <>
            <VolumeX className="w-4 h-4" />
            MATIKAN
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4" />
            BUNYIKAN
          </>
        )}
      </button>
    </div>
  );
}
