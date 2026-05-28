import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface PermissionsScreenProps {
  onAllGranted: () => void;
}

export default function PermissionsScreen({ onAllGranted }: PermissionsScreenProps) {
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [statuses, setStatuses] = useState({
    location: false,
    notifications: false,
    cameraMic: false,
    motion: typeof (window as any).DeviceMotionEvent !== 'undefined' && typeof (window as any).DeviceMotionEvent.requestPermission === 'function' ? false : true,
  });

  // Check currently granted permissions on mount (excluding those that require prompt to check easily)
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Location check
        if ('permissions' in navigator) {
          const locPerm = await navigator.permissions.query({ name: 'geolocation' });
          if (locPerm.state === 'granted') setStatuses(s => ({ ...s, location: true }));
        }

        // Notification check
        if ('Notification' in window && Notification.permission === 'granted') {
          setStatuses(s => ({ ...s, notifications: true }));
        }
      } catch (e) {
        console.error("Error checking permissions initially:", e);
      }
    };
    checkPermissions();
  }, []);

  // Check if all are granted to auto-hide
  useEffect(() => {
    if (statuses.location && statuses.notifications && statuses.cameraMic && statuses.motion) {
      onAllGranted();
    }
  }, [statuses, onAllGranted]);

  const requestAllPermissions = async () => {
    setLoading(true);
    let allSuccess = true;

    // 1. Geolocation
    if (!statuses.location) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              setStatuses(s => ({ ...s, location: true }));
              resolve(true);
            },
            (err) => {
              toast.error('Izin Lokasi (GPS) harus diaktifkan.');
              allSuccess = false;
              reject(err);
            }
          );
        });
      } catch (e) {
        setLoading(false);
        return;
      }
    }

    // 2. Notifications
    if (!statuses.notifications && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setStatuses(s => ({ ...s, notifications: true }));
        } else {
          toast.error('Izin Notifikasi ditolak pengguna.');
          allSuccess = false;
          setLoading(false);
          return;
        }
      } catch (e) {
        allSuccess = false;
      }
    }

    // 3. Camera & Microphone
    if (!statuses.cameraMic) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately
        setStatuses(s => ({ ...s, cameraMic: true }));
      } catch (err) {
        toast.error('Izin Kamera & Suara harus diaktifkan.');
        allSuccess = false;
        setLoading(false);
        return;
      }
    }

    // 4. Motion Sensors (primarily for iOS)
    if (!statuses.motion) {
      try {
        if (typeof (window as any).DeviceMotionEvent !== 'undefined' && typeof (window as any).DeviceMotionEvent.requestPermission === 'function') {
          const permissionState = await (window as any).DeviceMotionEvent.requestPermission();
          if (permissionState === 'granted') {
            setStatuses(s => ({ ...s, motion: true }));
          } else {
            toast.error('Izin Sensor Gerak ditolak.');
            allSuccess = false;
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    setLoading(false);
    
    if (allSuccess) {
      toast.success('Semua izin berhasil diberikan!');
      onAllGranted();
    }
  };

  return (
    <div className="flex-1 bg-surface-dim dark:bg-zinc-900 min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface dark:bg-zinc-950 p-6 rounded-3xl shadow-xl w-full max-w-sm flex flex-col items-center text-center border dark:border-zinc-800">
        <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[40px]">shield_lock</span>
        </div>
        
        <h2 className="text-display-sm font-display-sm font-bold text-on-surface dark:text-white mb-2">Akses Dibutuhkan</h2>
        <p className="text-body-lg text-on-surface-variant dark:text-zinc-400 mb-8 px-2">
          Agar aplikasi Wirasaga dapat berfungsi maksimal dalam keadaan darurat, kami memerlukan izin akses berikut:
        </p>

        <div className="w-full flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-4 bg-surface-container-lowest dark:bg-zinc-900 p-3 rounded-2xl border border-outline-variant/30 dark:border-zinc-800 text-left">
             <span className={`material-symbols-outlined text-[24px] ${statuses.location ? 'text-primary dark:text-red-500' : 'text-on-surface-variant dark:text-zinc-400'}`}>
               {statuses.location ? 'check_circle' : 'location_on'}
             </span>
             <div>
               <h4 className="font-bold text-label-lg text-on-surface dark:text-white">Lokasi (GPS)</h4>
               <p className="text-label-sm text-on-surface-variant dark:text-zinc-400">Menemukan bantuan terdekat</p>
             </div>
          </div>

          <div className="flex items-center gap-4 bg-surface-container-lowest dark:bg-zinc-900 p-3 rounded-2xl border border-outline-variant/30 dark:border-zinc-800 text-left">
             <span className={`material-symbols-outlined text-[24px] ${statuses.notifications ? 'text-primary dark:text-red-500' : 'text-on-surface-variant dark:text-zinc-400'}`}>
               {statuses.notifications ? 'check_circle' : 'notifications'}
             </span>
             <div>
               <h4 className="font-bold text-label-lg text-on-surface dark:text-white">Notifikasi</h4>
               <p className="text-label-sm text-on-surface-variant dark:text-zinc-400">Peringatan darurat & sirene</p>
             </div>
          </div>

          <div className="flex items-center gap-4 bg-surface-container-lowest dark:bg-zinc-900 p-3 rounded-2xl border border-outline-variant/30 dark:border-zinc-800 text-left">
             <span className={`material-symbols-outlined text-[24px] ${statuses.cameraMic ? 'text-primary dark:text-red-500' : 'text-on-surface-variant dark:text-zinc-400'}`}>
               {statuses.cameraMic ? 'check_circle' : 'videocam'}
             </span>
             <div>
               <h4 className="font-bold text-label-lg text-on-surface dark:text-white">Kamera & Suara</h4>
               <p className="text-label-sm text-on-surface-variant dark:text-zinc-400">Laporan multimoda AI</p>
             </div>
          </div>
          
          {typeof (window as any).DeviceMotionEvent !== 'undefined' && typeof (window as any).DeviceMotionEvent.requestPermission === 'function' && (
            <div className="flex items-center gap-4 bg-surface-container-lowest dark:bg-zinc-900 p-3 rounded-2xl border border-outline-variant/30 dark:border-zinc-800 text-left">
               <span className={`material-symbols-outlined text-[24px] ${statuses.motion ? 'text-primary dark:text-red-500' : 'text-on-surface-variant dark:text-zinc-400'}`}>
                 {statuses.motion ? 'check_circle' : 'vibration'}
               </span>
               <div>
                 <h4 className="font-bold text-label-lg text-on-surface dark:text-white">Sensor Gerak</h4>
                 <p className="text-label-sm text-on-surface-variant dark:text-zinc-400">Deteksi benturan jatuh</p>
               </div>
            </div>
          )}
        </div>

        <button
          onClick={requestAllPermissions}
          disabled={loading}
          className="w-full bg-primary text-on-primary font-bold text-title-md py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-md disabled:opacity-70 mb-3 cursor-pointer"
        >
          {loading ? (
            <span className="material-symbols-outlined animate-spin align-middle pr-1">refresh</span>
          ) : (
            <span className="material-symbols-outlined align-middle pr-1">security</span>
          )}
          {loading ? 'Memproses...' : 'Berikan Izin Akses'}
        </button>

        <button 
          onClick={() => setShowWarning(true)}
          disabled={loading}
          className="w-full bg-transparent text-on-surface-variant dark:text-zinc-400 font-medium text-title-md py-3 rounded-xl hover:bg-surface-container-highest dark:hover:bg-zinc-900 transition-colors disabled:opacity-70 cursor-pointer"
        >
          Lewati Untuk Saat Ini
        </button>
      </div>

      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface dark:bg-zinc-950 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 border dark:border-zinc-800">
             <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="material-symbols-outlined text-[32px]">warning</span>
             </div>
             <h3 className="text-title-lg font-bold text-center text-on-surface dark:text-white mb-2">Yakin Ingin Melewati?</h3>
             <p className="text-body-md text-center text-on-surface-variant dark:text-zinc-400 mb-6">
                Melewati perizinan akan mengurangi fungsi utama aplikasi (seperti GPS untuk radar bantuan, notifikasi darurat, dan lampiran laporan).
             </p>
             <div className="flex flex-col gap-3">
               <button 
                  onClick={() => {
                    setShowWarning(false);
                    toast.warning('Beberapa fungsi aplikasi mungkin tidak berjalan maksimal.');
                    onAllGranted();
                  }}
                  className="w-full bg-error text-on-error py-3 rounded-xl font-bold hover:bg-error/90 transition-colors cursor-pointer"
               >
                 Ya, Tetap Lewati
               </button>
               <button 
                  onClick={() => setShowWarning(false)}
                  className="w-full bg-surface-container-highest dark:bg-zinc-900 text-on-surface dark:text-zinc-200 hover:bg-surface-container-highest/80 dark:hover:bg-zinc-800 py-3 rounded-xl font-bold transition-colors cursor-pointer"
               >
                 Kembali dan Izinkan
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
