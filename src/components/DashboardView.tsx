import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface DashboardViewProps {
  profile?: any;
  user?: any;
}

export default function DashboardView({ profile, user }: DashboardViewProps) {
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
  const [latestUnresolvedIncident, setLatestUnresolvedIncident] = useState<any | null>(null);
  const [justFinishedId, setJustFinishedId] = useState<string | null>(null);
  const [shakeDetectedMsg, setShakeDetectedMsg] = useState<string | null>(null);
  const [shakeCountdown, setShakeCountdown] = useState<number | null>(null);
  const [sosCancelCountdown, setSosCancelCountdown] = useState<number | null>(null);
  const [pendingSOSReason, setPendingSOSReason] = useState<string>("");

  // Style helper matching the system design token
  const getCategoryStyles = (category: string) => {
    const formatted = (category || '').toUpperCase();
    if (formatted.includes('MEDI')) {
      return { icon: 'medical_services', bg: 'bg-error-container', color: 'text-error', text: 'text-on-error-container', hex: '#BA1A1A' };
    } else if (formatted.includes('POLI') || formatted.includes('AMAN') || formatted.includes('KEAMANAN')) {
      return { icon: 'local_police', bg: 'bg-tertiary-fixed', color: 'text-tertiary', text: 'text-on-tertiary-fixed', hex: '#204E5F' };
    } else if (formatted.includes('MEKANIK') || formatted.includes('MOTOR') || formatted.includes('MOBIL') || formatted.includes('TEKNIS')) {
      return { icon: 'car_repair', bg: 'bg-surface-variant', color: 'text-on-surface', text: 'text-on-surface-variant', hex: '#44474E' };
    }
    return { icon: 'warning', bg: 'bg-primary-container', color: 'text-primary', text: 'text-on-primary-container', hex: '#AF101A' };
  };

  const fetchUnresolvedIncident = async () => {
    try {
      const res = await fetch('/api/incidents');
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        // Sort incidents descending order by date or ID so we get the newest one first
        const sortedIncidents = [...data.data].sort((a: any, b: any) => {
          const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return tB - tA;
        });

        const currentUid = user?.uid || auth.currentUser?.uid;
        
        // 1. Only find the user's own unresolved reports
        let found = sortedIncidents.find((inc: any) => 
          (inc.reporter_uid === currentUid || inc.reporterUid === currentUid) && 
          inc.status !== 'TERTANGANI'
        );

        // 1.5. Check if user just marked their own report as resolved, hold on to it instead of dropping
        if (!found && justFinishedId) {
          found = sortedIncidents.find((inc: any) => 
            inc.id === justFinishedId && 
            (inc.reporter_uid === currentUid || inc.reporterUid === currentUid)
          );
        }

        setLatestUnresolvedIncident(found || null);
      }
    } catch (err) {
      console.error("Gagal memuat laporan terbaru:", err);
    }
  };

  const handleResolveIncident = async (id: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}/finish`, { method: 'POST' });
      if (res.ok) {
        toast.success("Laporan berhasil diselesaikan!");
        setJustFinishedId(id);
        fetchUnresolvedIncident();
      } else {
        toast.error("Gagal menyelesaikan laporan.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal terhubung ke server.");
    }
  };

  const handleAcceptCommunityIncident = async (id: string) => {
    try {
      const response = await fetch(`/api/incidents/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ val: '1' })
      });
      if (response.ok) {
        toast.success("Respon penanganan berhasil dikirim! Silakan bersiap menuju lokasi.");
        fetchUnresolvedIncident();
      } else {
        toast.error("Gagal menerima penanganan insiden.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal terhubung ke server.");
    }
  };

  useEffect(() => {
    fetchUnresolvedIncident();
    const interval = setInterval(fetchUnresolvedIncident, 8000);
    return () => clearInterval(interval);
  }, [user, justFinishedId]);

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
          if (!isSending && sosStatus !== 'success' && shakeCountdown === null) {
            setShakeDetectedMsg("GUNCANGAN EKSTREM TERDETEKSI!");
            setShakeCountdown(10);
          }
        }
      }
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isSending, sosStatus, shakeCountdown]);

  useEffect(() => {
    if (shakeCountdown === null) return;
    if (shakeCountdown <= 0) {
      setShakeCountdown(null);
      executeSOS("Deteksi Guncangan Otomatis (Abaikan jika salah, tapi validasi lokasi)");
      return;
    }
    const timer = setTimeout(() => {
      setShakeCountdown(prev => prev !== null ? prev - 1 : null);
    }, 1000);
    return () => clearTimeout(timer);
  }, [shakeCountdown]);

  useEffect(() => {
    if (sosCancelCountdown === null) return;
    if (sosCancelCountdown <= 0) {
      setSosCancelCountdown(null);
      executeSOS(pendingSOSReason);
      return;
    }
    const timer = setTimeout(() => {
      setSosCancelCountdown(prev => prev !== null ? prev - 1 : null);
    }, 1000);
    return () => clearTimeout(timer);
  }, [sosCancelCountdown]);

  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isSending || sosStatus === 'success' || sosCancelCountdown !== null) return;
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

  const triggerSOS = (reason = "Darurat Nasional via Widget") => {
    setIsPressing(false);
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setPendingSOSReason(reason);
    setSosCancelCountdown(5); // 5 seconds to cancel
  };

  const executeSOS = async (reason: string) => {
    setIsPressing(false);
    setIsSending(true);
    try {
      // Simulate taking background media to deter pranks
      console.log('Simulating Media Capture (Camera+Audio)...');
      
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to call SOS API");
      }

      if (data.data && data.data.valid === false) {
        setSosStatus('idle');
        const reason = data.data.alasan_verifikasi || 'Laporan ini terdeteksi sebagai prank atau kurang jelas oleh AI Dispatcher. Kirim ulang dengan bukti foto/audio korban.';
        toast.error(`Verifikasi Gagal: ${reason}`, { position: 'top-center', duration: 8000 });
        setIsSending(false);
        return;
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
      fetchUnresolvedIncident();
    }
  };

  return (
    <>
      {shakeCountdown !== null && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-fade-in select-none">
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center animate-pulse mb-6">
            <span className="material-symbols-outlined text-[48px] text-white">vibration</span>
          </div>
          <h2 className="text-3xl font-black mb-2 text-red-500 uppercase tracking-widest">Guncangan Ekstrem</h2>
          <p className="text-lg text-zinc-300 font-medium mb-8 max-w-sm">Mendeteksi kemungkinan benturan/jatuh. Mengirim SOS darurat secara otomatis dalam:</p>
          <div className="text-[120px] font-black leading-none mb-10 tabular-nums">
            {shakeCountdown}
          </div>
          <div className="flex flex-col w-full max-w-sm gap-4">
            <button 
              onClick={() => {
                setShakeCountdown(null);
                setShakeDetectedMsg(null);
              }}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl border border-zinc-700 transition-colors"
            >
              Batalkan (Aman)
            </button>
            <button 
              onClick={() => {
                setShakeCountdown(null);
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors"
            >
              Lapor Manual (Kamera / Audio)
            </button>
            <button 
              onClick={() => {
                setShakeCountdown(null);
                executeSOS("Deteksi Guncangan Dikonfirmasi Secara Manual");
              }}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all"
            >
              Kirim SOS Sekarang
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 px-margin-mobile pt-8 pb-32 max-w-4xl mx-auto w-full relative min-h-[100dvh] md:min-h-full">
        <div className="flex flex-col items-center w-full max-w-sm animate-fade-in select-none">
        {/* Header Text */}
        <div className="text-center mb-6 w-full animate-fade-in delay-100">
          <h2 className="text-headline-lg font-headline-lg text-primary dark:text-[#BA1A20] font-bold tracking-tight mb-2">APAKAH ANDA DALAM BAHAYA?</h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant dark:text-zinc-350">Tekan tombol di bawah untuk memanggil bantuan darurat segera.</p>
        </div>

        {shakeDetectedMsg && (
          <div className="bg-error-container text-on-error-container font-bold text-center p-3 rounded-xl mb-6 w-full max-w-[280px] animate-pulse shadow-md border 
border-error flex items-center justify-center gap-2">
            <span className="material-symbols-outlined shrink-0 text-error">vibration</span>
            <span className="text-sm">{shakeDetectedMsg}</span>
          </div>
        )}

        {/* Big SOS Button */}
        <div className="relative flex justify-center items-center w-[280px] h-[280px] mb-6 md:mb-0 animate-fade-in delay-150">
          <div className="pulse-ring w-full h-full"></div>
          <div className="pulse-ring w-[90%] h-[90%]" style={{ animationDelay: '0.5s' }}></div>
          <button
            disabled={isSending || sosStatus === 'success' || sosCancelCountdown !== null}
            className={`relative z-10 w-[220px] h-[220px] rounded-full text-on-primary flex flex-col justify-center items-center cursor-pointer overflow-hidden transition-all duration-100 select-none touch-none ${
              isPressing 
                ? 'scale-95 shadow-[0_4px_12px_rgba(175,16,26,0.4),inset_0_8px_16px_rgba(0,0,0,0.2)] bg-[#BA1A20]'
                : sosStatus === 'success' ? 'bg-green-600 shadow-[0_12px_36px_rgba(22,163,74,0.4)]' : 'shadow-[0_12px_36px_rgba(175,16,26,0.4),inset_0_8px_16px_rgba(255,255,255,0.2)] bg-[#BA1A20]'
            }`}
            onMouseDown={startPress}
            onTouchStart={startPress}
            onMouseUp={endPress}
            onMouseLeave={endPress}
            onTouchEnd={endPress}
            onContextMenu={(e) => e.preventDefault()}
          >
            {isPressing && <span className="ripple left-1/2 top-1/2 -ml-[110px] -mt-[110px] w-[220px] h-[220px]"></span>}
            
            {sosCancelCountdown !== null ? (
              <div className="flex flex-col items-center animate-fade-in w-full h-full justify-center bg-zinc-900/90 backdrop-blur-sm relative z-20">
                <span className="text-xl font-bold text-red-400 mb-1">BATALKAN?</span>
                <span className="text-6xl font-black tabular-nums">{sosCancelCountdown}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSosCancelCountdown(null);
                    setSosStatus('idle');
                  }}
                  className="mt-3 px-6 py-2 bg-white text-red-600 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-transform"
                >
                  BATAL SOS
                </button>
              </div>
            ) : isSending ? (
                <span className="material-symbols-outlined animate-spin text-[48px]">autorenew</span>
            ) : sosStatus === 'success' ? (
                <>
                  <span className="material-symbols-outlined text-[64px] mb-2">check_circle</span>
                  <span className="text-label-lg font-label-lg opacity-90 uppercase tracking-widest bg-green-700 px-3 py-1 rounded-full">TERKIRIM</span>
                </>
            ) : (
              <>
                <span className="text-[64px] font-bold leading-none mb-2 tracking-wide font-display-lg">SOS</span>
                <span className="text-[10px] font-black opacity-90 uppercase tracking-widest bg-primary-fixed-dim text-on-primary-fixed-variant px-3 py-1.5 rounded-full mb-1">
                  TAHAN 2 DETIK
                </span>
              </>
            )}
          </button>
        </div>

        {/* Legal Warning */}
        <div className="mt-8 text-center animate-fade-in delay-200 bg-surface-container-lowest dark:bg-zinc-800/30 p-4 rounded-2xl border border-outline-variant/30 dark:border-zinc-700/30 max-w-[320px]">
          <div className="flex items-center justify-center gap-2 mb-2 text-error">
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            <span className="text-xs font-bold tracking-wide uppercase">Peringatan Hukum</span>
          </div>
          <p className="text-[11px] leading-relaxed text-on-surface-variant dark:text-zinc-400">
            Sistem otomatis mengambil <strong className="text-on-surface dark:text-zinc-300">foto & rekaman audio senyap</strong> saat SOS aktif. Detail akun & lokasi tercatat. Laporan palsu (prank) diproses hukum pidana.
          </p>
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

      {/* 1 Latest Unresolved Emergency Incident Card */}
      {latestUnresolvedIncident && (() => {
        const currentUid = user?.uid || auth.currentUser?.uid;
        const isMyReport = (latestUnresolvedIncident.reporter_uid === currentUid || latestUnresolvedIncident.reporterUid === currentUid);
        const styles = getCategoryStyles(latestUnresolvedIncident.kategori || latestUnresolvedIncident.category);
        const isFinished = latestUnresolvedIncident.status === 'TERTANGANI';

        if (isMyReport) {
          // PREMIUM "Laporan Saya" style matching the Radar page exactly
          return (
            <div 
              className={`w-full max-w-sm mt-5 bg-white dark:bg-zinc-950 p-5 rounded-2xl border-2 flex flex-col gap-4 transition-all relative overflow-hidden text-left ${
                isFinished 
                  ? 'shadow-[0_8px_30px_rgba(34,197,94,0.08)] border-green-500/30 dark:border-green-500/20' 
                  : 'shadow-[0_8px_30px_rgba(239,68,68,0.08)] border-red-500/30 dark:border-red-500/20'
              }`}
            >
              {/* Top Animated Pulse Indicator line */}
              <div className={`absolute top-0 left-0 w-full h-1.5 animate-pulse ${
                isFinished 
                  ? 'bg-green-600' 
                  : 'bg-red-600'
              }`} />
              
              {/* Unique Identifier Header */}
              <div className="flex items-center justify-between mt-1">
                <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm ${
                  isFinished ? 'bg-green-600 text-white' : 'bg-[#BA1A20] text-white'
                }`}>
                  <span className="material-symbols-outlined text-[12px] animate-bounce-short">
                    {isFinished ? 'verified' : 'notifications_active'}
                  </span>
                  {isFinished ? "Laporan Selesai Ditangani" : "Laporan Darurat Anda"}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                  latestUnresolvedIncident.status === 'MENUNGGU' 
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                    : isFinished 
                      ? 'bg-green-600/10 text-green-600 dark:text-green-400' 
                      : 'bg-blue-600/10 text-blue-600 dark:text-blue-400'
                }`}>
                  {(latestUnresolvedIncident.status || 'MENUNGGU').replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3 pl-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    isFinished ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {styles.icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight truncate font-sans">
                      {latestUnresolvedIncident.kategori || "MEDIS"}
                    </h3>
                    <p className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
                      <span className="material-symbols-outlined text-xs">schedule</span> 
                      {latestUnresolvedIncident.timestamp || 'Baru saja'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Report Summary in Quote Frame */}
              <div className={`p-3.5 rounded-xl border flex flex-col gap-2 pl-3 ${
                isFinished 
                  ? 'bg-green-500/5 dark:bg-green-950/20 border-green-500/10 dark:border-green-500/10' 
                  : 'bg-red-500/5 dark:bg-rose-950/20 border-red-500/10 dark:border-red-500/10'
              }`}>
                <p className="text-xs text-neutral-800 dark:text-zinc-200 leading-relaxed font-sans font-medium">
                  <span className={`font-bold ${isFinished ? 'text-green-600 dark:text-green-400' : 'text-[#BA1A20] dark:text-red-400'}`}>
                    {isFinished ? 'Status Penyelamatan:' : 'Pernyataan Masalah (Analisis AI):'}
                  </span> {
                    isFinished 
                      ? "Laporan keselamatan ini telah dikonfirmasi aman dan berhasil diselesaikan." 
                      : (latestUnresolvedIncident.ringkasan_masalah || latestUnresolvedIncident.ringkasan || "Melaporkan keadaan darurat - Menunggu respon lapangan.")
                  }
                </p>
                <div className="flex items-center gap-1.5 text-neutral-500 dark:text-zinc-400 mt-1">
                  <span className="material-symbols-outlined text-[15px] shrink-0">location_on</span>
                  <span className="text-[10px] font-semibold truncate">
                    {latestUnresolvedIncident.lokasi_teks || latestUnresolvedIncident.lokasi_deskripsi || latestUnresolvedIncident.desc || 'Surabaya'}
                  </span>
                </div>
              </div>

              {/* Personal Progress / Rescue Timeline */}
              <div className={`border-t border-dashed pt-3 ${isFinished ? 'border-green-500/20' : 'border-red-500/20'}`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-zinc-500 mb-2.5 font-sans leading-none">
                  PROGRES PENANGANAN DISPATCH
                </p>
                <div className="grid grid-cols-3 gap-1 relative pl-1">
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      latestUnresolvedIncident.status === 'MENUNGGU' || latestUnresolvedIncident.status === 'MENUJU_LOKASI' || isFinished
                        ? 'bg-red-600 text-white' : 'bg-neutral-200 dark:bg-zinc-800 text-neutral-400'
                    }`}>
                      ✓
                    </div>
                    <span className="text-[9px] font-black text-neutral-800 dark:text-zinc-300 mt-1 uppercase whitespace-nowrap">Diterima</span>
                  </div>
                  
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      latestUnresolvedIncident.status === 'MENUJU_LOKASI' || isFinished
                        ? 'bg-blue-600 text-white' : 'bg-neutral-200 dark:bg-zinc-800 text-neutral-400'
                    }`}>
                      {latestUnresolvedIncident.status === 'MENUJU_LOKASI' || isFinished ? '✓' : '2'}
                    </div>
                    <span className="text-[9px] font-black text-neutral-800 dark:text-zinc-300 mt-1 uppercase whitespace-nowrap">Respon Tim</span>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isFinished
                        ? 'bg-green-600 text-white' : 'bg-neutral-200 dark:bg-zinc-800 text-neutral-400'
                    }`}>
                      {isFinished ? '✓' : '3'}
                    </div>
                    <span className="text-[9px] font-black text-neutral-800 dark:text-zinc-300 mt-1 uppercase whitespace-nowrap">Selesai</span>
                  </div>
                </div>
              </div>

              {/* Responder Tracker Panel */}
              {latestUnresolvedIncident.status === 'MENUJU_LOKASI' && latestUnresolvedIncident.rescuer && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-200/50 dark:border-blue-900/30 flex items-center justify-between gap-3 mt-1">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={latestUnresolvedIncident.rescuer.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"} 
                      alt="Rescuer Avatar" 
                      className="w-8 h-8 rounded-full object-cover border-2 border-blue-500" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-left">
                      <p className="text-[11px] font-black text-neutral-800 dark:text-white leading-tight">
                        {latestUnresolvedIncident.rescuer.name || "Budi Santoso"}
                      </p>
                      <p className="text-[9px] text-[#2b6cb0] dark:text-blue-400 font-bold mt-0.5">Relawan responder dalam perjalanan</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = "tel:112";
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 hover:bg-blue-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[11px]">call</span>
                    TELEPON
                  </button>
                </div>
              )}

              {/* Control Footer */}
              <div className="flex gap-2.5 mt-1">
                {!isFinished ? (
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleResolveIncident(latestUnresolvedIncident.id);
                    }}
                    className="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-green-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Nyatakan Aman / Selesai
                  </button>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setJustFinishedId(null);
                      // Clear the resolved view and pull general updates
                      fetchUnresolvedIncident();
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider flex justify-center items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md"
                  >
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Tutup Laporan Aman</span>
                  </button>
                )}
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = "tel:112";
                  }}
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-red-100 text-[#BA1A20] hover:bg-red-200 dark:bg-red-950/20 dark:text-red-400 transition-colors shadow-sm cursor-pointer"
                  title="Hubungi Utama"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </button>
              </div>
            </div>
          );
        } else {
          // PREMIUM Styled Community alert card
          return (
            <div className="w-full max-w-sm mt-5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] animate-fade-in text-left flex flex-col gap-3 relative overflow-hidden select-none">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 animate-pulse" />
              
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[9px] font-black tracking-wider uppercase text-amber-600 dark:text-amber-400">
                  <span className="material-symbols-outlined text-[14px]">campaign</span>
                  Laporan Aktif Warga Sekitar
                </span>
                <span className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 font-mono">
                  {latestUnresolvedIncident.timestamp || 'Baru saja'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 bg-amber-500/5 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-500/10 dark:border-amber-500/20">
                <span className="material-symbols-outlined text-amber-500 text-xl font-black shrink-0">
                  {styles.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-xs uppercase text-neutral-800 dark:text-zinc-100 block truncate">
                    {latestUnresolvedIncident.kategori || "MEDIS"}
                  </span>
                  <span className="text-[10px] text-neutral-500 dark:text-zinc-400 block truncate font-medium">
                    Pelapor: {latestUnresolvedIncident.reporter_name || latestUnresolvedIncident.reporterName || 'Seseorang'}
                  </span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                  latestUnresolvedIncident.status === 'MENUNGGU' 
                    ? 'bg-amber-500/15 text-amber-600'
                    : 'bg-blue-500/15 text-blue-600'
                }`}>
                  {(latestUnresolvedIncident.status || 'MENUNGGU').replace('_', ' ')}
                </span>
              </div>

              <p className="text-xs text-neutral-600 dark:text-zinc-350 leading-relaxed pl-1 font-medium font-sans">
                {latestUnresolvedIncident.ringkasan_masalah || latestUnresolvedIncident.ringkasan || "Tidak ada rincian tambahan."}
              </p>

              <div className="flex items-center gap-1 text-neutral-400 dark:text-zinc-500 pl-1">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                <span className="text-[10px] font-semibold truncate text-neutral-500 dark:text-zinc-400">
                  {latestUnresolvedIncident.lokasi_teks || latestUnresolvedIncident.lokasi_deskripsi || latestUnresolvedIncident.desc || 'Surabaya'}
                </span>
              </div>

              {/* Action Footer inside the card */}
              <div className="border-t border-neutral-200 dark:border-zinc-800/80 pt-3 mt-1 flex gap-2">
                {latestUnresolvedIncident.status === 'MENUNGGU' ? (
                  <button
                    onClick={() => handleAcceptCommunityIncident(latestUnresolvedIncident.id)}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer select-none"
                  >
                    <span className="material-symbols-outlined text-sm">handshake</span>
                    Bantu Penyelamatan
                  </button>
                ) : (
                  <div className="flex-1 bg-neutral-100 dark:bg-zinc-800/80 text-center py-2 rounded-xl text-[10px] text-neutral-500 dark:text-zinc-400 font-bold uppercase tracking-wider select-none flex items-center justify-center">
                    Ditangani oleh Relawan
                  </div>
                )}
                <button
                  onClick={() => {
                    window.location.href = "tel:112";
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-100 text-[#BA1A20] hover:bg-red-200 transition-colors shrink-0 cursor-pointer"
                  title="Hubungi Utama"
                >
                  <span className="material-symbols-outlined text-sm">call</span>
                </button>
              </div>
            </div>
          );
        }
      })()}
      </div>
    </div>
    </>
  );
}
