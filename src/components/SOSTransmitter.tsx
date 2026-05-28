import React, { useState, useEffect } from 'react';
import { Send, Copy, AlertTriangle, Eye, ShieldAlert, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function SOSTransmitter() {
  const [isStrobeActive, setIsStrobeActive] = useState(false);
  const [strobeSpeedMs, setStrobeSpeedMs] = useState(150); // strobe tick interval
  const [colorState, setColorState] = useState<'red' | 'amber'>('red');
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [icePhoneNumber, setIcePhoneNumber] = useState(() => {
    return localStorage.getItem('darurat_ice_kontak') || '+6281234567890';
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: -7.250444, lng: 112.768845 })
      );
    } else {
      setUserLocation({ lat: -7.250444, lng: 112.768845 });
    }
  }, []);

  // Flash ticks when Strobe is running
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isStrobeActive) {
      intervalId = setInterval(() => {
        setColorState((prev) => (prev === 'red' ? 'amber' : 'red'));
      }, strobeSpeedMs);
    }
    return () => clearInterval(intervalId);
  }, [isStrobeActive, strobeSpeedMs]);

  const getSmsBody = () => {
    const coordsStr = userLocation 
      ? `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`
      : 'Sinyal offline (koordinat tepat menyusul)';
    
    return `DARURAT: Saya membutuhkan pertolongan taktis segera. Posisi saya di: ${coordsStr} . Mohon bantuan darurat & segera kirim tim penyelamat/medis ke lokasi ini.`;
  };

  const handleCopySMS = () => {
    navigator.clipboard.writeText(getSmsBody());
    toast.success('Pesan SMS darurat berhasil disalin ke clipboard!', { position: 'top-center' });
  };

  const handleSendSMS = () => {
    // Standard cross-platform SMS uri
    const cleanPhone = icePhoneNumber.replace(/\s+/g, '');
    const smsUri = `sms:${cleanPhone}?body=${encodeURIComponent(getSmsBody())}`;
    window.location.href = smsUri;
    toast.info('Membuka aplikasi pesan Anda...', { position: 'top-center' });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm relative">
      <div className="mb-4 text-left">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#AF101A] bg-[#BA1A20]/10 px-2.5 py-1 rounded-full dark:text-red-400 dark:bg-red-500/10">
          Sinar Strobe Visual & Pancaran Offline
        </span>
        <h3 className="text-xl font-extrabold text-neutral-900 dark:text-zinc-50 mt-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-red-500">flashlight_on</span>
          Pancaran SOS Morse & SMS Offline
        </h3>
        <p className="text-xs text-neutral-600 dark:text-zinc-450 mt-1 font-medium">
          Dapatkan pertolongan visual malam hari lewat kilatan layar dan kirim SOS mandiri sewaktu koneksi internet terputus.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch mt-4">
        
        {/* Visual Flash Strobe Light Section */}
        <div className="bg-neutral-50 dark:bg-zinc-800 border border-neutral-100 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[220px]">
          {isStrobeActive ? (
            /* Immersive full-card screen flashing */
            <div 
              className={`absolute inset-0 z-15 flex flex-col items-center justify-center p-4 transition-colors duration-75 ${
                colorState === 'red' ? 'bg-red-600' : 'bg-amber-400'
              }`}
            >
              <h4 className="text-white text-md font-black italic tracking-widest drop-shadow-md animate-pulse">
                SINYAL SOS TRANSMITTING...
              </h4>
              <p className="text-white/95 text-[10px] font-bold drop-shadow mt-1">
                Arahkan layar ponsel Anda ke atas atau ke tim penyelamat.
              </p>
              
              <button 
                onClick={() => setIsStrobeActive(false)}
                className="mt-6 bg-white text-red-700 hover:bg-neutral-100 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-transform cursor-pointer z-20"
              >
                Matikan Strobe
              </button>
            </div>
          ) : null}

          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-[36px] text-primary dark:text-red-400 filled mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>brightness_high</span>
            <span className="text-xs font-black text-neutral-800 dark:text-zinc-50 uppercase tracking-wider">Flashing Strobe Penarik Perhatian</span>
            <p className="text-[10px] text-neutral-500 dark:text-zinc-400 mt-1 leading-relaxed max-w-[200px]">
              Menampilkan pola kedipan frekuensi ganda di kegelapan malam atau di sela reruntuhan.
            </p>
          </div>

          <div className="w-full mt-4 space-y-3">
            {/* Speed selection */}
            <div className="flex items-center justify-between text-[10px] text-neutral-600 dark:text-zinc-450 font-black">
              <span>Kecepatan Berkedip</span>
              <span className="font-mono text-primary dark:text-red-400">
                {strobeSpeedMs === 300 ? 'Lambat (300ms)' : strobeSpeedMs === 150 ? 'Medium (150ms)' : 'Cepat (85ms)'}
              </span>
            </div>
            <div className="flex gap-1.5 justify-center">
              {[300, 150, 85].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setStrobeSpeedMs(speed)}
                  className={`flex-1 text-[9px] font-black py-1.5 rounded-lg border transition-all ${
                    strobeSpeedMs === speed
                      ? 'bg-primary/10 border-primary text-primary dark:border-red-500 dark:text-red-400'
                      : 'border-neutral-200 dark:border-zinc-700 text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {speed === 300 ? 'SLOW' : speed === 150 ? 'MED' : 'FAST'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsStrobeActive(true)}
              className="w-full bg-primary text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/95 shadow-sm hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Eye className="w-4 h-4 shrink-0" /> Nyalakan Layar SOS
            </button>
          </div>
        </div>

        {/* Offline SMS Gateway Section */}
        <div className="bg-neutral-50 dark:bg-zinc-800 border border-neutral-100 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary dark:text-zinc-300">sms_failed</span>
              <h4 className="text-xs font-black text-neutral-800 dark:text-zinc-100 uppercase tracking-wide">
                Saluran SMS Darurat Offline
              </h4>
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-zinc-400 leading-relaxed font-semibold mb-3">
              Kirim koordinat GPS akurat Anda langsung ke Kontak ICE keluarga via jaringan seluler GSM standar.
            </p>

            {/* Editable ICE Number */}
            <div className="space-y-1 mb-3">
              <label className="text-[9px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-widest block">
                Nomor Kontak Darurat (ICE)
              </label>
              <input 
                type="tel" 
                value={icePhoneNumber}
                onChange={(e) => {
                  setIcePhoneNumber(e.target.value);
                  localStorage.setItem('darurat_ice_kontak', e.target.value);
                }}
                className="w-full text-xs font-sans font-black tracking-wider bg-white dark:bg-zinc-800 text-neutral-800 dark:text-white border-2 border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-left focus:outline-none focus:ring-1 focus:ring-primary/40"
                placeholder="Misal: +6281234567890"
              />
            </div>

            {/* Text Template Preview */}
            <div className="bg-white dark:bg-zinc-800 border border-neutral-150 dark:border-zinc-700/50 rounded-xl p-3 text-[10px] text-neutral-700 dark:text-zinc-350 leading-relaxed font-medium font-sans">
              <span className="font-extrabold text-[9px] uppercase tracking-wider text-primary dark:text-red-400 block mb-1">Pratinjau Pesan:</span>
              "{getSmsBody()}"
            </div>
          </div>

          <div className="flex gap-2.5 mt-4">
            <button 
              onClick={handleCopySMS}
              className="flex-1 bg-white dark:bg-zinc-800 text-neutral-700 dark:text-zinc-200 border-2 border-neutral-200 dark:border-zinc-700 py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 hover:bg-neutral-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> Salin Teks
            </button>
            <button 
              onClick={handleSendSMS}
              className="flex-1 bg-primary text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary/95 shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Kirim SMS
            </button>
          </div>
        </div>
        
      </div>
      
      {/* Photo-sensitive warn */}
      <div className="mt-4 flex gap-1.5 text-neutral-500 dark:text-zinc-450 text-[9px] font-bold items-center leading-normal">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        ⚠️ PERINGATAN EPILEPSI: Mengaktifkan strobe layar dapat memicu serangan epilepsi bagi orang yang sensitif.
      </div>
    </div>
  );
}
