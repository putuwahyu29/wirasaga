import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface DashboardViewProps {
  profile?: any;
}

export default function DashboardView({ profile }: DashboardViewProps) {
  const [isPressing, setIsPressing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sosStatus, setSosStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  
  const [photoSelected, setPhotoSelected] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioRecorded, setAudioRecorded] = useState(false);

  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  // High quality local emergency siren feedback states
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const alarmAudioCtxRef = useRef<AudioContext | null>(null);
  const alarmOscillatorRef1 = useRef<OscillatorNode | null>(null);
  const alarmOscillatorRef2 = useRef<OscillatorNode | null>(null);
  const alarmLfoRef = useRef<OscillatorNode | null>(null);
  const alarmGainRef = useRef<GainNode | null>(null);

  const startLocalAlarm = () => {
    try {
      if (isAlarmPlaying) return;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      alarmAudioCtxRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      // Setup swooping dual alarms
      osc1.frequency.setValueAtTime(450, ctx.currentTime);
      osc2.frequency.setValueAtTime(600, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 2.0; 
      lfoGain.gain.value = 150;  

      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      gain.gain.setValueAtTime(0.12, ctx.currentTime); 

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      lfo.start();

      alarmOscillatorRef1.current = osc1;
      alarmOscillatorRef2.current = osc2;
      alarmLfoRef.current = lfo;
      alarmGainRef.current = gain;
      setIsAlarmPlaying(true);
    } catch (err) {
      console.error("Failed to play local SOS siren:", err);
    }
  };

  const stopLocalAlarm = () => {
    try {
      if (alarmOscillatorRef1.current) {
        alarmOscillatorRef1.current.stop();
        alarmOscillatorRef1.current.disconnect();
        alarmOscillatorRef1.current = null;
      }
      if (alarmOscillatorRef2.current) {
        alarmOscillatorRef2.current.stop();
        alarmOscillatorRef2.current.disconnect();
        alarmOscillatorRef2.current = null;
      }
      if (alarmLfoRef.current) {
        alarmLfoRef.current.stop();
        alarmLfoRef.current.disconnect();
        alarmLfoRef.current = null;
      }
      if (alarmGainRef.current) {
        alarmGainRef.current.disconnect();
        alarmGainRef.current = null;
      }
      if (alarmAudioCtxRef.current) {
        alarmAudioCtxRef.current.close();
        alarmAudioCtxRef.current = null;
      }
      setIsAlarmPlaying(false);
    } catch (e) {
      console.error("Failed to stop local SOS siren:", e);
    }
  };

  useEffect(() => {
    return () => {
      // Prevent sound leaks on unmount
      if (alarmOscillatorRef1.current || alarmOscillatorRef2.current) {
        try {
          if (alarmOscillatorRef1.current) alarmOscillatorRef1.current.stop();
          if (alarmOscillatorRef2.current) alarmOscillatorRef2.current.stop();
        } catch {}
      }
    };
  }, []);

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    // Get real GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
           setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
           // Fallback if failed
           setUserLocation({ lat: -7.250444, lng: 112.768845 });
        }
      );
    } else {
       setUserLocation({ lat: -7.250444, lng: 112.768845 });
    }

    // Deteksi Guncangan (Simulated DeviceMotionEvent for fall / crash detection)
    // Ditune ke batas 75 agar tidak mudah terpicu saat digoyangkan biasa, mencegah false-alarm
    const handleMotion = (event: DeviceMotionEvent) => {
      const { acceleration } = event;
      if (acceleration && acceleration.x && acceleration.y && acceleration.z) {
        const totalAccel = Math.abs(acceleration.x) + Math.abs(acceleration.y) + Math.abs(acceleration.z);
        if (totalAccel > 75) { // High thresh for heavy drop, crash, or severe accident
          if (!isSending && sosStatus !== 'success') {
            triggerSOS("Deteksi Guncangan (Tabrakan / Jatuh Keras)");
          }
        }
      }
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isSending, sosStatus]);

  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isSending || sosStatus === 'success') return;
    setIsPressing(true);
    setSosStatus('idle');
    pressTimer.current = setTimeout(() => {
      triggerSOS();
    }, 2000);
  };

  const endPress = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsPressing(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  const triggerSOS = async (reason = "Darurat Nasional via Widget") => {
    setIsPressing(false);
    setIsSending(true);
    try {
      const response = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: userLocation?.lat || -7.250444,
          longitude: userLocation?.lng || 112.768845,
          locationText: reason,
          imageBase64: photoSelected,
          audioBase64: audioBase64,
          reporterUid: auth.currentUser?.uid,
          reporterName: profile?.name || auth.currentUser?.displayName || "Pelapor Darurat",
          reporterProfile: profile,
        })
      });

      if (!response.ok) {
        throw new Error("Failed to call SOS API");
      }

      setSosStatus('success');
      startLocalAlarm();
      setTimeout(() => {
        // Always show the beautiful in-app toast notification first to ensure perfect iframe presentation
        toast.success('Laporan SOS terkirim. Smart Dispatcher (AI) sedang merespon.', { position: 'top-center', duration: 6000 });
        
        // Safely try native system push notifications (may blow up or be blocked inside iframe context)
        try {
          if ('Notification' in window && window.Notification && window.Notification.permission === 'granted') {
            new window.Notification('Peringatan Darurat', {
              body: 'Laporan SOS terkirim. Smart Dispatcher (AI) sedang merespon.'
            });
          }
        } catch (pushErr) {
          console.log("Native system notification dropped or blocked by sandboxed frame context:", pushErr);
        }
      }, 500);
    } catch (err) {
      console.error(err);
      setSosStatus('error');
      toast.error('Gagal mengirim sinyal darurat (AI API Gagal)!', { position: 'top-center' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 px-margin-mobile pt-8 pb-32 max-w-4xl mx-auto w-full relative min-h-[100dvh] md:min-h-full">
      <div className="flex flex-col items-center w-full max-w-sm animate-fade-in">
        {/* Header Text */}
        <div className="text-center mb-10 w-full animate-fade-in delay-100">
          <h2 className="text-headline-lg font-headline-lg text-primary dark:text-[#BA1A20] font-bold tracking-tight mb-2">APAKAH ANDA DALAM BAHAYA?</h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant dark:text-zinc-350">Tekan tombol di bawah untuk memanggil bantuan darurat segera.</p>
        </div>

        {/* Big SOS Button */}
        <div className="relative flex justify-center items-center w-[280px] h-[280px] mb-6 md:mb-0 animate-fade-in delay-150">
          <div className="pulse-ring w-full h-full"></div>
          <div className="pulse-ring w-[90%] h-[90%]" style={{ animationDelay: '0.5s' }}></div>
          <button
            disabled={isSending || sosStatus === 'success'}
            className={`relative z-10 w-[220px] h-[220px] rounded-full text-on-primary flex flex-col justify-center items-center cursor-pointer overflow-hidden transition-all duration-100 ${
              isPressing 
                ? 'scale-95 shadow-[0_4px_12px_rgba(175,16,26,0.4),inset_0_8px_16px_rgba(0,0,0,0.2)] bg-[radial-gradient(circle,var(--color-primary-container)_0%,var(--color-primary)_100%)]'
                : sosStatus === 'success' ? 'bg-green-600 shadow-[0_12px_36px_rgba(22,163,74,0.4)]' : 'shadow-[0_12px_36px_rgba(175,16,26,0.4),inset_0_8px_16px_rgba(255,255,255,0.2)] bg-[radial-gradient(circle,var(--color-primary-container)_0%,var(--color-primary)_100%)]'
            }`}
            onMouseDown={startPress}
            onTouchStart={startPress}
            onMouseUp={endPress}
            onMouseLeave={endPress}
            onTouchEnd={endPress}
          >
            {isPressing && <span className="ripple left-1/2 top-1/2 -ml-[110px] -mt-[110px] w-[220px] h-[220px]"></span>}
            {isSending ? (
                <span className="material-symbols-outlined animate-spin text-[48px]">autorenew</span>
            ) : sosStatus === 'success' ? (
                <>
                  <span className="material-symbols-outlined text-[64px] mb-2">check_circle</span>
                  <span className="text-label-lg font-label-lg opacity-90 uppercase tracking-widest bg-green-700 px-3 py-1 rounded-full">TERKIRIM</span>
                </>
            ) : (
              <>
                <span className="text-[64px] font-bold leading-none mb-2 tracking-wide font-display-lg">SOS</span>
                <span className="text-label-lg font-label-lg opacity-90 uppercase tracking-widest bg-primary-fixed-dim text-on-primary-fixed-variant px-3 py-1 rounded-full">
                  TAHAN 2 DETIK
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center w-full max-w-sm">
        {/* Action Cards Grid */}
        <div className="grid grid-cols-2 gap-4 w-full mb-8 animate-fade-in delay-200">
        <label className={`rounded-2xl p-6 flex flex-col items-center justify-center gap-3 border shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all active:scale-[0.97] cursor-pointer group ${photoSelected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white border-neutral-200 dark:bg-zinc-900/40 hover:bg-neutral-50 dark:hover:bg-zinc-850 dark:border-zinc-800'}`}>
          <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden relative border border-neutral-200/50 dark:border-zinc-750">
            {photoSelected ? (
              <img src={photoSelected} alt="Foto Kejadian" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[#BA1A20] dark:text-red-400 text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
            )}
          </div>
          <span className="text-xs font-black text-center text-neutral-800 dark:text-zinc-200 uppercase tracking-wider font-sans leading-tight">
            {photoSelected ? 'Foto Dilampirkan' : <>Kirim Foto<br />Kejadian</>}
          </span>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setPhotoSelected(ev.target?.result as string);
                  toast.success('Foto berhasil diunggah dan dilampirkan.', { position: 'top-center' });
                };
                reader.readAsDataURL(file);
              }
            }} 
          />
        </label>

        <button 
          disabled={isRecording || audioRecorded}
          onClick={async () => {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              setIsRecording(true);
              const mediaRecorder = new MediaRecorder(stream);
              const audioChunks: Blob[] = [];

              mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                  audioChunks.push(event.data);
                }
              };

              mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = () => {
                  setAudioBase64(reader.result as string);
                  setAudioRecorded(true);
                  toast.success('Rekaman suara berhasil dilampirkan.', { position: 'top-center' });
                  setIsRecording(false);
                };
                reader.readAsDataURL(audioBlob);
                stream.getTracks().forEach(track => track.stop());
              };

              mediaRecorder.start();
              
              let time = 10; // PRD asks for up to 10 seconds
              const toastId = toast.loading(`Merekam audio (maks 10s)... (${time}s)`, { position: 'top-center' });
              
              const interval = setInterval(() => {
                time -= 1;
                if (time > 0) {
                  toast.loading(`Merekam audio (maks 10s)... (${time}s)`, { id: toastId, position: 'top-center' });
                }
              }, 1000);

              setTimeout(() => {
                clearInterval(interval);
                if (mediaRecorder.state === 'recording') {
                  mediaRecorder.stop();
                  toast.dismiss(toastId);
                }
              }, 10000);

            } catch (err) {
              console.error("Gagal mengakses mikropon:", err);
              toast.error('Izin mikropon ditolak atau tidak tersedia.', { position: 'top-center' });
            }
          }}
          className={`rounded-2xl p-6 flex flex-col items-center justify-center gap-3 border shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all active:scale-[0.97] group ${
            isRecording ? 'bg-red-500/15 border-red-500/40 animate-pulse' :
            audioRecorded ? 'bg-emerald-500/10 border-emerald-500/30 cursor-default' : 
            'bg-white border-neutral-200 dark:bg-zinc-900/40 hover:bg-neutral-50 dark:hover:bg-zinc-800 dark:border-zinc-800 cursor-pointer'
          }`}
        >
          <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform relative border border-neutral-200/50 dark:border-zinc-750">
            {isRecording ? (
               <>
                 <span className="w-full h-full absolute rounded-full bg-red-500/20 animate-ping"></span>
                 <span className="material-symbols-outlined text-red-500 z-10 text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
               </>
            ) : audioRecorded ? (
               <span className="material-symbols-outlined text-emerald-500 text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            ) : (
               <span className="material-symbols-outlined text-[#BA1A20] dark:text-red-400 text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
            )}
          </div>
          <span className={`text-xs font-black text-center uppercase tracking-wider font-sans leading-tight ${isRecording ? 'text-red-500 animate-pulse animate-duration-750' : 'text-neutral-800 dark:text-zinc-200'}`}>
            {isRecording ? 'Merekam...' : audioRecorded ? 'Suara Dilampirkan' : <>Rekam Suara<br />Darurat</>}
          </span>
        </button>
      </div>

      {/* Status Indicator */}
      <div className="bg-surface-container-low dark:bg-zinc-900 rounded-full px-4 py-2 flex items-center justify-center gap-2 animate-fade-in delay-300 w-full max-w-sm">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        <span className="text-label-md font-label-md text-on-surface-variant dark:text-zinc-400 uppercase tracking-wider">Lokasi GPS Aktif</span>
      </div>

      {/* Visual Emergency Sirens Controls for Active SOS Status */}
      {sosStatus === 'success' && (
        <div className="w-full max-w-sm mt-4 bg-red-600/10 dark:bg-red-500/10 border-2 border-red-500/20 rounded-2xl p-4 text-center animate-pulse">
          <p className="text-xs font-black text-red-600 dark:text-red-400 flex items-center justify-center gap-2 uppercase tracking-wide">
            <span className="material-symbols-outlined text-[18px] animate-bounce">campaign</span>
            Sirine Aktif di HP Anda
          </p>
          <p className="text-[10px] text-neutral-500 dark:text-zinc-450 mt-1 font-semibold">
            Bunyi keras menyala untuk memanggil & membimbing tim penyelamat sekitar.
          </p>
          <div className="flex gap-2 mt-3 justify-center items-center">
            <button
              onClick={() => {
                if (isAlarmPlaying) stopLocalAlarm();
                else startLocalAlarm();
              }}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                isAlarmPlaying 
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm' 
                  : 'bg-neutral-105 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-300'
              }`}
            >
              {isAlarmPlaying ? 'Mute Sirine' : 'Bunyikan Sirine'}
            </button>
            <button
              onClick={() => {
                stopLocalAlarm();
                setSosStatus('idle');
              }}
              className="px-3.5 py-2 bg-neutral-105 hover:bg-neutral-200 dark:bg-zinc-805 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              Reset SOS / Selesai
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
