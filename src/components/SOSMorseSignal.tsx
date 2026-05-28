import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, StopCircle, PlayCircle, Settings, Volume2, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function SOSMorseSignal() {
  const [isActive, setIsActive] = useState(false);
  const [useAudio, setUseAudio] = useState(true);
  const [strobeColor, setStrobeColor] = useState<'white' | 'red' | 'amber'>('white');
  const [lightState, setLightState] = useState(false); // true represents "light on"
  const [currentSymbol, setCurrentSymbol] = useState<'.' | '-' | ' '>(' ');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // SOS Morse Code pattern elements in milliseconds (unit t = 150ms)
  // Dot: 1 unit, Dash: 3 units, gap between elements: 1 unit, gap between letters: 3 units, gap between words: 7 units
  // "... --- ..." 
  const unit = 180; // duration of 1 dot unit in ms
  const sosSequence = [
    { type: 'dot', duration: unit, active: true, label: '.' },
    { type: 'gap', duration: unit, active: false, label: '' },
    { type: 'dot', duration: unit, active: true, label: '.' },
    { type: 'gap', duration: unit, active: false, label: '' },
    { type: 'dot', duration: unit, active: true, label: '.' },
    
    { type: 'letter_gap', duration: unit * 3, active: false, label: '' },
    
    { type: 'dash', duration: unit * 3, active: true, label: '-' },
    { type: 'gap', duration: unit, active: false, label: '' },
    { type: 'dash', duration: unit * 3, active: true, label: '-' },
    { type: 'gap', duration: unit, active: false, label: '' },
    { type: 'dash', duration: unit * 3, active: true, label: '-' },
    
    { type: 'letter_gap', duration: unit * 3, active: false, label: '' },
    
    { type: 'dot', duration: unit, active: true, label: '.' },
    { type: 'gap', duration: unit, active: false, label: '' },
    { type: 'dot', duration: unit, active: true, label: '.' },
    { type: 'gap', duration: unit, active: false, label: '' },
    { type: 'dot', duration: unit, active: true, label: '.' },
    
    { type: 'word_gap', duration: unit * 7, active: false, label: ' ' }
  ];

  const playBuzzer = (duration: number) => {
    if (!useAudio) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();

      osc.type = 'square'; // penetrating square wave
      osc.frequency.setValueAtTime(950, audioCtxRef.current.currentTime); // high piercing pitch
      
      gain.gain.setValueAtTime(0.15, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + (duration / 1000));

      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      osc.start();
      osc.stop(audioCtxRef.current.currentTime + (duration / 1000));
    } catch (e) {
      console.error('Audio signal error:', e);
    }
  };

  const playVibration = (duration: number) => {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  useEffect(() => {
    if (!isActive) {
      setLightState(false);
      setCurrentSymbol(' ');
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    let currentIndex = 0;

    const runSignal = () => {
      const step = sosSequence[currentIndex];
      
      // Update visual blinking and auditory/vibratory feedback
      setLightState(step.active);
      if (step.active) {
        setCurrentSymbol(step.type === 'dot' ? '.' : '-');
        playBuzzer(step.duration);
        playVibration(step.duration);
      } else {
        setCurrentSymbol(' ');
      }

      timerRef.current = setTimeout(() => {
        currentIndex = (currentIndex + 1) % sosSequence.length;
        runSignal();
      }, step.duration);
    };

    runSignal();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive, strobeColor, useAudio]);

  const toggleStrobe = () => {
    if (!isActive) {
      setIsActive(true);
      toast.info('Sinyal Morse SOS Berjalan! Hadapkan layar ke arah luar/atas.', { position: 'top-center' });
    } else {
      setIsActive(false);
    }
  };

  // Strobe background color class map
  const colorMap = {
    white: 'bg-white',
    red: 'bg-red-600',
    amber: 'bg-amber-500'
  };

  const getLightBg = () => {
    if (!lightState) return 'bg-neutral-900';
    return colorMap[strobeColor];
  };

  return (
    <div className="bg-transparent w-full p-3 sm:p-5 relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="mb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#AF101A] bg-[#BA1A20]/10 px-2.5 py-1 rounded-full dark:text-red-400 dark:bg-red-500/10">
          Sinyal Lokator Darurat
        </span>
        <h3 className="text-xl font-extrabold text-neutral-900 dark:text-zinc-50 mt-3 flex items-center gap-2 font-sans">
          <Lightbulb className="w-5 h-5 text-primary dark:text-red-500 animate-pulse" />
          Senter Pelacak SOS & Sandi Morse
        </h3>
        <p className="text-xs text-neutral-600 dark:text-zinc-450 mt-1 font-medium">
          Mengedipkan kecerahan layar & suara piezo berpola SOS darurat nasional (`... --- ...`) untuk memudahkan helikopter, drone, atau tim SAR darat melacak posisi Anda.
        </p>
      </div>

      {/* Interactive Strobe Panel */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          
          {/* Main Blink Screen Canvas */}
          <div className="md:col-span-2 flex flex-col items-center justify-center p-3 sm:p-4 bg-neutral-950 rounded-2xl border border-zinc-800 relative overflow-hidden min-h-[180px]">
            <div className={`absolute inset-0 transition-colors duration-75 ${getLightBg()} opacity-90`}></div>
            
            {/* Dark overlay when off, to maintain readable elements */}
            <div className={`absolute inset-0 bg-black/60 z-10 pointer-events-none transition-opacity ${lightState ? 'opacity-0' : 'opacity-105'}`}></div>

            <div className="relative z-20 text-center flex flex-col items-center justify-center">
              <span className={`material-symbols-outlined text-[48px] ${lightState ? 'text-black font-extrabold rotate-[15deg]' : 'text-neutral-500'} transition-all duration-75`}>
                emergency_home
              </span>
              <p className={`text-xs font-black tracking-widest mt-2 transition-all ${lightState ? 'text-black shadow-sm' : 'text-white'}`}>
                {isActive ? 'MEMANCARKAN KODE SOS...' : 'SINYAL STANDBY'}
              </p>
              
              {isActive && (
                <div className="flex gap-1.5 mt-4 items-center justify-center bg-black/40 px-3 py-1.5 rounded-full text-white backdrop-blur-sm">
                  <span className={`w-3 h-3 rounded-full ${lightState ? 'bg-green-500 animate-pulse' : 'bg-neutral-600'}`}></span>
                  <span className="text-sm font-mono tracking-widest font-black text-center w-8">
                    {currentSymbol !== ' ' ? currentSymbol : ' '}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Strobe settings/control bar */}
          <div className="bg-neutral-50 dark:bg-zinc-900/60 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200">
                <span className="flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-neutral-400" />
                  Warna Senter
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-1.5">
                {(['white', 'red', 'amber'] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => setStrobeColor(color)}
                    className={`py-2 px-1 text-[10px] font-black uppercase rounded-lg border-2 transition-all cursor-pointer ${
                      strobeColor === color
                        ? 'border-primary bg-primary-container/10 text-primary dark:border-[#BA1A20] dark:text-red-400'
                        : 'border-neutral-200 dark:border-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {color === 'white' ? 'Putih' : color === 'red' ? 'Merah' : 'Amber'}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-zinc-800/80">
                <label className="flex items-center justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer select-none">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-neutral-400" />
                    Suara Piezo (Buzzer)
                  </span>
                  <input
                    type="checkbox"
                    checked={useAudio}
                    onChange={(e) => setUseAudio(e.target.checked)}
                    className="h-4 w-4 rounded text-primary focus:ring-primary text-[#AF101A]"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={toggleStrobe}
              className={`w-full py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isActive
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black hover:scale-[1.01]'
                  : 'bg-primary dark:bg-[#BA1A20] text-white hover:bg-red-700'
              }`}
            >
              {isActive ? (
                <>
                  <StopCircle className="w-4 h-4" />
                  HENTIKAN SOS
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  AKTIFKAN SOS
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tactical Info Badge */}
        <div className="bg-red-500/5 border border-primary/10 rounded-xl p-3 text-[11px] text-neutral-700 dark:text-zinc-350 flex items-start gap-2.5 font-medium leading-relaxed">
          <Shield className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
          <span>
            <strong>Pro-Tip Survival:</strong> Di dalam gua, reruntuhan gempa, atau kabut gunung, pantulkan kilatan strobe ini ke langit-langit atau pepohonan tinggi agar memancar lebih lebar bagi tim SAR berkemampuan penglihatan malam (IR/Thermal).
          </span>
        </div>
      </div>
    </div>
  );
}
