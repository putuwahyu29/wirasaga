import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { toast } from 'sonner';
import { auth } from '../firebase';

// Using consistent interface
interface Incident {
  id: string;
  lat: number;
  lng: number;
  valid: boolean;
  kategori: string;
  ringkasan_masalah: string;
  lokasi_deskripsi: string;
  timestamp: string;
  reporterName?: string;
  status?: string;
  reporter_uid?: string;
  reporterUid?: string;
  rescuer?: {
    name: string;
    avatar?: string;
    rating?: number;
    distance_m?: number;
    arrival_time_min?: number;
  } | null;
}

interface RadarSekitarViewProps {
  profile?: {
    name: string;
    avatar: string;
    email?: string;
    phone?: string;
    bloodType?: string;
    allergies?: string;
    medicalHistory?: string;
  };
}

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

const playSiren = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.5);
    oscillator.frequency.linearRampToValueAtTime(400, audioCtx.currentTime + 1.0);
    oscillator.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 1.5);
    oscillator.frequency.linearRampToValueAtTime(400, audioCtx.currentTime + 2.0);
    
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 2.5);
  } catch(e) {
    console.warn("Play Siren error:", e);
  }
};

function Directions({ destination, origin, onRouteFound }: { destination: google.maps.LatLngLiteral, origin: google.maps.LatLngLiteral, onRouteFound?: (legs: any) => void }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();
  const hasFittedRef = useRef<string | null>(null);
  const onRouteFoundRef = useRef(onRouteFound);

  useEffect(() => {
    onRouteFoundRef.current = onRouteFound;
  }, [onRouteFound]);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    const renderer = new routesLibrary.DirectionsRenderer({ 
      map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#BA1A20', strokeWeight: 5 }
    });
    setDirectionsRenderer(renderer);
    return () => {
      renderer.setMap(null);
    };
  }, [routesLibrary, map]);

  const originLat = origin.lat;
  const originLng = origin.lng;
  const destLat = destination.lat;
  const destLng = destination.lng;
  const destKey = `${destLat},${destLng}`;

  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    directionsService.route({
      origin: { lat: originLat, lng: originLng }, 
      destination: { lat: destLat, lng: destLng },
      travelMode: 'DRIVING' as any
    }).then(response => {
      directionsRenderer.setDirections(response);
      if (onRouteFoundRef.current && response.routes && response.routes[0]) {
        onRouteFoundRef.current(response.routes[0].legs[0]);
      }
      
      // Only fit bounds on first paint or when destination coordinates actually change
      if (map && hasFittedRef.current !== destKey) {
        hasFittedRef.current = destKey;
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: originLat, lng: originLng });
        bounds.extend({ lat: destLat, lng: destLng });
        map.fitBounds(bounds);
        
        // Tilt for ideal navigation view
        const timerId = setTimeout(() => {
          map.setTilt(45);
          const currentZoom = map.getZoom();
          if (currentZoom) map.setZoom(currentZoom + 1);
        }, 500);
        return () => clearTimeout(timerId);
      }
    }).catch(err => {
      console.error("Failed to compute route:", err);
    });
  }, [directionsService, directionsRenderer, originLat, originLng, destLat, destLng, map, destKey]);

  return null;
}

export default function RadarSekitarView({ profile }: RadarSekitarViewProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const prevIncidentsLength = useRef(0);
  const [selectedIncidentInfo, setSelectedIncidentInfo] = useState<any>(null);
  const [activeDestination, setActiveDestination] = useState<google.maps.LatLngLiteral | null>(null);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [activeDestinationName, setActiveDestinationName] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: -7.250444, lng: 112.768845 });

  const [showShelters, setShowShelters] = useState(false);
  const [showHospitals, setShowHospitals] = useState(false);
  const [activeRadarTab, setActiveRadarTab] = useState<'sekitar' | 'saya'>('sekitar');

  // Dynamic evacuation shelter targets located close to the user's real GPS or Surabaya coordinate center
  const shelters = [
    {
      id: 'shelter-1',
      name: 'Posko Evakuasi GOR Kertajaya',
      type: 'POSKO EVAKUASI',
      icon: 'holiday_village',
      bg: 'bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/40',
      color: 'text-green-700 dark:text-green-400',
      text: 'text-green-800 dark:text-green-300',
      hex: '#2E7D32',
      lat: userLocation.lat + 0.007,
      lng: userLocation.lng - 0.005,
      ringkasan: 'Kapasitas s.d 600 jiwa. Dilengkapi fasilitas kasur tebal, dapur umum aktif bimbingan BNPB, posko tim medis siaga, MCK, dan area ramah anak.',
      reporterName: 'BNPB Kota Surabaya',
      desc: 'GOR Kertajaya Indoor Arena (Zona Hijau)',
      status: 'AKTIF'
    },
    {
      id: 'shelter-2',
      name: 'Aula Serbaguna Kecamatan Genteng',
      type: 'POSKO EVAKUASI',
      icon: 'cabin',
      bg: 'bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/40',
      color: 'text-green-700 dark:text-green-400',
      text: 'text-green-800 dark:text-green-300',
      hex: '#2E7D32',
      lat: userLocation.lat - 0.004,
      lng: userLocation.lng + 0.009,
      ringkasan: 'Aula ber-AC, kapasitas hingga 180 jiwa. Dilengkapi genset listrik cadangan, bahan pangan siap saji, popok bayi, dan pasokan air bersih.',
      reporterName: 'Satpol PP Kecamatan',
      desc: 'Gedung Pertemuan Genteng Baru (Lantai 1)',
      status: 'AKTIF'
    }
  ];

  const hospitals = [
    {
      id: 'hosp-1',
      name: 'Unit Gawat Darurat Sentral RSUD Dr. Soetomo',
      type: 'FASILITAS MEDIS',
      icon: 'local_hospital',
      bg: 'bg-teal-50 border border-teal-200 dark:bg-teal-950/20 dark:border-teal-800/40',
      color: 'text-teal-700 dark:text-teal-400',
      text: 'text-teal-800 dark:text-teal-300',
      hex: '#00796B',
      lat: userLocation.lat - 0.009,
      lng: userLocation.lng - 0.006,
      ringkasan: 'Instalasi Gawat Darurat trauma krisis 24 jam dengan ketersediaan bank darah, ambulans ICU mobile, dan dokter spesialis bedah darurat.',
      reporterName: 'Dinas Kesehatan Surabaya',
      desc: 'RSUD Dr. Soetomo (Pintu Masuk Utama UGD Jln. Dharmawangsa)',
      status: 'BUKA'
    },
    {
      id: 'hosp-2',
      name: 'Puskesmas Siaga Rawat Inap Kedungdoro',
      type: 'FASILITAS MEDIS',
      icon: 'local_hospital',
      bg: 'bg-teal-50 border border-teal-200 dark:bg-teal-950/20 dark:border-teal-800/40',
      color: 'text-teal-700 dark:text-teal-400',
      text: 'text-teal-800 dark:text-teal-300',
      hex: '#00796B',
      lat: userLocation.lat + 0.008,
      lng: userLocation.lng + 0.007,
      ringkasan: 'Layanan medis primer siaga 24 jam. Dilengkapi tabung oksigen oksimetri, obat luka, jahitan, penawar racun gigit serangga, dan ambulans siaga.',
      reporterName: 'Pemerintah Kota Surabaya',
      desc: 'Puskesmas Kedungdoro Jln. Kawi No. 5',
      status: 'BUKA'
    }
  ];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: -7.250444, lng: 112.768845 })
      );
    }
  }, []);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch('/api/incidents');
        const data = await res.json();
        if (data.status === 'success' && data.data) {
          setIncidents(data.data);
          
          if (data.data.length > prevIncidentsLength.current && prevIncidentsLength.current > 0) {
            playSiren();
            
            // Deliver robust system-level notification via Service Worker registration
            let hasShownNotification = false;
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification('Darurat Baru!', {
                  body: 'Seseorang di sekitar Anda membutuhkan bantuan!',
                  icon: '/logo.svg',
                  badge: '/logo.svg'
                });
                hasShownNotification = true;
              }).catch(() => {
                // Secondary fallback using classical window API
                if ('Notification' in window && window.Notification && window.Notification.permission === 'granted') {
                  new window.Notification('Darurat Baru!', { body: 'Seseorang di sekitar Anda membutuhkan bantuan!' });
                  hasShownNotification = true;
                }
              });
            } else if ('Notification' in window && window.Notification && window.Notification.permission === 'granted') {
              new window.Notification('Darurat Baru!', { body: 'Seseorang di sekitar Anda membutuhkan bantuan!' });
              hasShownNotification = true;
            }

            // Always display a prominent, actionable layout toast to guarantee visibility
            toast.error('Keadaan darurat baru terdeteksi di sekitar Anda!', { 
              position: 'top-center', 
              duration: 6000 
            });
          }
          prevIncidentsLength.current = data.data.length;
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchIncidents();
      
    // Poll every 10 seconds for real-time updates
    const intervalId = setInterval(fetchIncidents, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // Map backend logic to UI colors
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'MEDIS': return { icon: 'medical_services', bg: 'bg-error-container', color: 'text-error', text: 'text-on-error-container', hex: '#BA1A1A' };
      case 'KEAMANAN': return { icon: 'local_police', bg: 'bg-tertiary-fixed', color: 'text-tertiary', text: 'text-on-tertiary-fixed', hex: '#204E5F' };
      case 'MEKANIK': return { icon: 'car_repair', bg: 'bg-surface-variant', color: 'text-on-surface', text: 'text-on-surface-variant', hex: '#44474E' };
      default: return { icon: 'warning', bg: 'bg-primary-container', color: 'text-primary', text: 'text-on-primary-container', hex: '#AF101A' };
    }
  };

  const handleAccept = async (id: string, lat: number, lng: number) => {
    try {
      const response = await fetch(`/api/incidents/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rescuerName: profile?.name || 'Pengguna',
          rescuerAvatar: profile?.avatar || ''
        })
      });
      if (response.ok) {
        setIncidents(prev => prev.map(inc => {
          if (inc.id === id) {
            return { 
              ...inc, 
              status: 'MENUJU_LOKASI',
              rescuer: {
                name: profile?.name || 'Pengguna',
                avatar: profile?.avatar || ''
              }
            };
          }
          return inc;
        }));
        
        // Find existing match info
        const matched = incidents.find(inc => inc.id === id);
        const nameLabel = matched ? `${matched.kategori} - ${matched.reporter_name || 'Korban'}` : 'Misi Penyelamatan Darurat';
        
        setActiveDestinationName(nameLabel);
        setActiveDestination({ lat, lng });
        setActiveIncidentId(id);
        setIsNavigating(true);
        toast.success("Rute menuju lokasi telah ditampilkan di peta", { position: 'top-center' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [showAll, setShowAll] = useState(false);
  const handleCancelHelp = async (id: string) => {
    try {
      const response = await fetch(`/api/incidents/${id}/cancel`, { method: 'POST' });
      if (response.ok) {
        setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'MENUNGGU' } : inc));
        setIsNavigating(false);
        setActiveIncidentId(null);
        toast.info("Pertolongan dibatalkan.");
      }
    } catch (err) {}
  };

  const handleFinishHelp = async (id: string) => {
    try {
      const response = await fetch(`/api/incidents/${id}/finish`, { method: 'POST' });
      if (response.ok) {
        setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'TERTANGANI' } : inc));
        setIsNavigating(false);
        setActiveIncidentId(null);
        toast.success("Bantuan selesai! Terima kasih.");
      }
    } catch (err) {}
  };

  const [showVictimInfoModal, setShowVictimInfoModal] = useState(false);

  const radarItems = incidents.map(inc => {
    const style = getCategoryStyles(inc.kategori);
    
    // Shift static mock incidents to be near the user's real location so direction routes are valid and beautiful
    let lat = inc.lat;
    let lng = inc.lng;
    
    // Check if it's the static seed or extremely far from userLocation.
    // If userLocation is somewhere else, and inc.lat/lng are Surabaya defaults, let's place them neatly near the user
    const isMockSurabaya = Math.abs(inc.lat - (-7.2589)) < 0.05 && Math.abs(inc.lng - 112.7388) < 0.05;
    if (isMockSurabaya && (inc.id === 'inc-1' || inc.id === 'inc-2')) {
      if (inc.id === 'inc-1') {
        lat = userLocation.lat + 0.005;
        lng = userLocation.lng - 0.004;
      } else {
        lat = userLocation.lat - 0.003;
        lng = userLocation.lng + 0.005;
      }
    }

    return {
      id: inc.id,
      name: inc.kategori,
      desc: inc.lokasi_deskripsi || 'Lokasi tidak diketahui',
      type: inc.kategori,
      icon: style.icon,
      bg: style.bg,
      color: style.color,
      text: style.text,
      time: inc.timestamp,
      status: inc.status || 'MENUNGGU',
      lat: lat,
      lng: lng,
      ringkasan: inc.ringkasan_masalah,
      reporterName: inc.reporter_name || inc.reporterName || 'Warga',
      reporterUid: inc.reporter_uid || inc.reporterUid,
      rescuer: inc.rescuer
    };
  });

  const myReports = radarItems.filter(item => {
    const currentUid = auth.currentUser?.uid;
    return item.reporterUid && currentUid && item.reporterUid === currentUid;
  });

  const otherReports = radarItems.filter(item => {
    const currentUid = auth.currentUser?.uid;
    return !item.reporterUid || !currentUid || item.reporterUid !== currentUid;
  });

  if (isNavigating && activeDestination) {
    return (
      <div className="fixed inset-0 z-[100] bg-zinc-50 dark:bg-zinc-950 flex flex-col animate-fade-in h-[100dvh]">
        {/* Navigation Header */}
        <div className="bg-white dark:bg-zinc-900 border-b border-neutral-200 dark:border-zinc-800 p-4 flex items-center justify-between shadow-md z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setIsNavigating(false);
                setActiveDestination(null);
                setActiveIncidentId(null);
                setActiveDestinationName(null);
              }} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-105 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors text-neutral-800 dark:text-white"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="text-left">
              <h2 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider font-sans">Navigasi Darurat</h2>
              <p className="text-[11px] font-bold flex items-center gap-1 text-red-500">
                <span className="material-symbols-outlined text-xs animate-pulse">directions_run</span>
                MENYELAMATKAN KORBAN • TRANSMISI GPS LIVE
              </p>
            </div>
          </div>
        </div>

        {/* Turn-by-turn Info Overlay */}
        {routeInfo && routeInfo.steps && routeInfo.steps[0] && (
          <div className="absolute top-20 left-4 right-4 z-20 bg-white/95 dark:bg-zinc-900/95 border border-neutral-200/80 dark:border-zinc-800/80 shadow-2xl p-4 rounded-2xl flex items-center gap-4 backdrop-blur-md animate-slide-up">
            <div className="w-11 h-11 bg-red-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-[28px]">
                {routeInfo.steps[0].maneuver ? (routeInfo.steps[0].maneuver.includes('right') ? 'turn_right' : 'turn_left') : 'straight'}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
               <h3 className="text-xs font-bold leading-tight text-neutral-900 dark:text-white font-sans [&_b]:text-red-500 dark:[&_b]:text-red-400 [&_div]:text-neutral-600 dark:[&_div]:text-zinc-300 [&_*]:text-neutral-900 dark:[&_*]:text-white [&_b]:font-black" dangerouslySetInnerHTML={{ __html: routeInfo.steps[0].instructions }}></h3>
               <p className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 mt-1 flex items-center gap-2 font-mono">
                 <span className="material-symbols-outlined text-xs">straighten</span> <span>{routeInfo.steps[0].distance.text}</span>
                 <span className="text-neutral-350 dark:text-zinc-650">|</span>
                 <span className="material-symbols-outlined text-xs">schedule</span> <span>{routeInfo.steps[0].duration.text}</span>
               </p>
            </div>
          </div>
        )}

        {/* Full Screen Map Controller */}
        <div className="flex-1 relative w-full h-full overflow-hidden bg-neutral-105 dark:bg-zinc-950">
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={userLocation}
              defaultZoom={17}
              mapId="WIRASAGA_MAP_NAV"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              disableDefaultUI={true}
              tilt={45}
            >
              <Directions destination={activeDestination} origin={userLocation} onRouteFound={(legs) => setRouteInfo(legs)} />

              {/* User Live Pin with continuous radar waves */}
              <AdvancedMarker position={userLocation}>
                <div className="flex items-center justify-center relative animate-pulse">
                  <div className="absolute w-12 h-12 rounded-full bg-red-500/40 animate-ping" />
                  <div className="w-6 h-6 bg-[#BA1A20] rounded-full border-[3px] border-white shadow-xl z-10 flex items-center justify-center animate-pulse" style={{ transform: 'rotate(45deg)' }}>
                    <div className="w-2.5 h-2.5 bg-white rounded-sm" />
                  </div>
                </div>
              </AdvancedMarker>

              {/* Victim Pin */}
              <AdvancedMarker position={activeDestination}>
                <Pin background="#000000" glyphColor="#ffffff" borderColor="#BA1A20" scale={1.2}>
                  <span className="material-symbols-outlined text-[10px] text-red-500">campaign</span>
                </Pin>
              </AdvancedMarker>
            </Map>
          </APIProvider>
        </div>

        {/* Action Bottom Sheet Controls */}
        <div className="bg-white dark:bg-zinc-900 pb-safe pt-3 px-6 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_24px_rgba(0,0,0,0.5)] rounded-t-3xl z-10 shrink-0 border-t border-neutral-200 dark:border-zinc-800 relative">
           <div className="w-12 h-1 bg-neutral-300 dark:bg-zinc-700 rounded-full mx-auto mb-4"></div>
           <div className="flex flex-col gap-3 pb-6 max-w-md mx-auto">
              {activeIncidentId && !activeIncidentId.startsWith('shelter') && !activeIncidentId.startsWith('hosp') ? (
                <>
                  <button 
                    onClick={() => setShowVictimInfoModal(true)}
                    className="w-full bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">medical_services</span>
                    Lihat Rekam Medis & Alergi Korban
                  </button>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => activeIncidentId && handleCancelHelp(activeIncidentId)}
                      className="flex-1 bg-neutral-105 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-350 hover:bg-neutral-200 dark:hover:bg-zinc-700 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 border border-neutral-250 dark:border-zinc-700 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      Batalkan
                    </button>
                    <button 
                      onClick={() => activeIncidentId && handleFinishHelp(activeIncidentId)}
                      className="flex-[2] bg-emerald-600 text-white hover:bg-emerald-700 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-950/20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      Pertolongan Selesai
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  <div className="text-center py-2 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl p-3">
                    <p className="text-[10px] text-neutral-500 dark:text-zinc-400 uppercase tracking-widest font-mono">Tujuan Navigasi Darurat</p>
                    <p className="font-extrabold text-neutral-905 dark:text-white text-sm mt-1">{activeDestinationName || 'Fasilitas Terkait'}</p>
                  </div>
                  <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => {
                        setIsNavigating(false);
                        setActiveDestination(null);
                        setActiveIncidentId(null);
                        setActiveDestinationName(null);
                      }}
                      className="flex-1 bg-neutral-100 hover:bg-neutral-250 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-neutral-250 dark:border-zinc-700 text-neutral-700 dark:text-zinc-350 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      Batalkan
                    </button>
                    <button 
                      onClick={() => {
                        setIsNavigating(false);
                        setActiveDestination(null);
                        setActiveIncidentId(null);
                        setActiveDestinationName(null);
                      }}
                      className="flex-[2] bg-emerald-600 text-white hover:bg-emerald-700 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      Selesai Navigasi
                    </button>
                  </div>
                </div>
              )}
           </div>
        </div>

        {/* Victim Info Backdrop Modal */}
        {showVictimInfoModal && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-fade-in group">
             <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-900 w-full max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl p-6 relative overflow-y-auto max-h-[90vh] border border-neutral-200 dark:border-zinc-800 text-left">
                <button onClick={() => setShowVictimInfoModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-105 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors text-neutral-500 dark:text-zinc-350">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>

                <div className="flex flex-col items-center mb-6">
                   <div className="w-14 h-14 bg-red-500/15 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-3 border border-red-500/20">
                      <span className="material-symbols-outlined text-[28px]">medical_services</span>
                   </div>
                   <h3 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">KARTU DIAGNOSIS MEDIS DARURAT</h3>
                   <p className="text-[10px] text-neutral-500 dark:text-zinc-400 flex items-center gap-1 mt-1 bg-neutral-100 dark:bg-zinc-950 px-2.5 py-1 rounded-full border border-neutral-200 dark:border-zinc-800">
                     <span className="material-symbols-outlined text-[13px] text-emerald-600 dark:text-emerald-400">lock</span> 
                     REKAM MEDIS TEROTORISASI SATELIT BNPB
                   </p>
                </div>
                
                {/* Getting the current incident object */}
                {(() => {
                  const currentInc = incidents.find(i => i.id === activeIncidentId);
                  const pData = currentInc?.reporter_profile;
                  
                  return (
                    <div className="space-y-4">
                      <div className="bg-neutral-50 dark:bg-zinc-950 p-4 rounded-xl border border-neutral-200 dark:border-zinc-800 flex justify-between items-center">
                         <div>
                           <p className="text-[10px] text-neutral-500 dark:text-zinc-400 uppercase tracking-widest font-mono">Nama Pelapor / Korban</p>
                           <p className="font-bold text-neutral-900 dark:text-white text-sm mt-0.5">{currentInc?.reporter_name || 'Korban Anonim'}</p>
                         </div>
                         <div className="bg-red-500/10 w-12 h-12 rounded-xl flex items-center justify-center flex-col shrink-0 border border-red-500/20">
                            <span className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase">Darah</span>
                            <span className="text-sm font-bold text-red-500 dark:text-red-400 leading-none">{pData?.bloodType || '?'}</span>
                         </div>
                      </div>

                      <div className="bg-neutral-50 dark:bg-zinc-950 p-4 rounded-xl border border-neutral-200 dark:border-zinc-800">
                         <p className="text-[10px] text-neutral-500 dark:text-zinc-400 uppercase tracking-widest font-mono mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">medical_information</span> Riwayat Penyakit Khusus</p>
                         <p className="font-bold text-neutral-800 dark:text-zinc-200 text-xs">{pData?.medicalHistory || 'Tidak ada riwayat laporan.'}</p>
                      </div>

                      <div className="bg-neutral-50 dark:bg-zinc-950 p-4 rounded-xl border border-neutral-200 dark:border-zinc-800">
                         <p className="text-[10px] text-neutral-550 dark:text-zinc-400 uppercase tracking-widest font-mono mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">allergy</span> Alergi</p>
                         <p className="font-bold text-neutral-800 dark:text-zinc-200 text-xs">{pData?.allergies || 'Tidak ada alergi yang dilaporkan.'}</p>
                      </div>
                      
                      {currentInc?.ringkasan_masalah && (
                         <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-200 dark:border-red-900/20">
                           <p className="text-label-sm text-neutral-500 dark:text-zinc-400 mb-1">Catatan Kejadian</p>
                           <p className="font-bold text-red-800 dark:text-red-200 text-body-md">{currentInc.ringkasan_masalah}</p>
                         </div>
                      )}
                    </div>
                  );
                })()}

                <button 
                  onClick={() => setShowVictimInfoModal(false)}
                  className="w-full bg-neutral-105 hover:bg-neutral-200 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 py-3.5 rounded-xl font-bold mt-6 dark:hover:bg-zinc-700 transition-colors cursor-pointer border border-neutral-200 dark:border-zinc-700"
                >
                  Tutup Informasi
                </button>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 md:px-0 pt-4 max-w-xl mx-auto w-full animate-fade-in pb-40 text-left">
      
      {/* Interactive Map Card */}
      <section className="relative w-full h-[350px] md:h-[420px] bg-zinc-100 dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden border border-neutral-200 dark:border-zinc-805 flex flex-col shrink-0">
        <APIProvider apiKey={API_KEY} version="weekly">
          {/* MAP FILTER OVERLAY */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-neutral-200 dark:border-zinc-805">
            <button
              onClick={() => setShowShelters((p) => !p)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all ${
                showShelters 
                  ? 'bg-green-600 text-white shadow' 
                  : 'text-neutral-700 dark:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-800'
              }`}
            >
              Tent ⛺ Posko
            </button>
            <button
              onClick={() => setShowHospitals((p) => !p)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all ${
                showHospitals 
                  ? 'bg-teal-700 text-white shadow' 
                  : 'text-neutral-700 dark:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-800'
              }`}
            >
              Hosp 🏥 Medis
            </button>
          </div>
          
          <Map
            defaultCenter={userLocation}
            defaultZoom={13}
            mapId="WIRASAGA_MAP_MAIN"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            disableDefaultUI={true}
          >
            {activeDestination && <Directions origin={userLocation} destination={activeDestination} />}

            {/* User Location */}
            <AdvancedMarker position={userLocation}>
              <div className="flex items-center justify-center">
                <div className="radar-pulse-ring !w-16 !h-16 !-ml-[32px] !-mt-[32px]"></div>
                <div className="w-5 h-5 bg-primary rounded-full border-[3px] border-on-primary shadow-md z-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            </AdvancedMarker>

            {/* Incidents on map with custom highlighted beacon for My Reports */}
            {radarItems.map((inc) => {
              const hex = getCategoryStyles(inc.type).hex;
              const isMyReport = inc.reporterUid === auth.currentUser?.uid;
              return (
                <AdvancedMarker 
                  key={inc.id} 
                  position={{ lat: inc.lat || -7.2589, lng: inc.lng || 112.7388 }}
                  onClick={() => setSelectedIncidentInfo(inc)}
                >
                  {isMyReport ? (
                    <div className="flex items-center justify-center relative">
                      <div className="absolute w-12 h-12 rounded-full bg-red-500/30 animate-ping" />
                      <Pin background="#BA1A20" glyphColor="#ffffff" borderColor="#ffffff" scale={1.25}>
                        <span className="material-symbols-outlined text-[10px] text-white">campaign</span>
                      </Pin>
                    </div>
                  ) : (
                    <Pin background={hex} glyphColor="#ffffff" borderColor="transparent" />
                  )}
                </AdvancedMarker>
              );
            })}

            {/* Dynamic Evacuation Shelters */}
            {showShelters && shelters.map((sh) => (
              <AdvancedMarker
                key={sh.id}
                position={{ lat: sh.lat, lng: sh.lng }}
                onClick={() => setSelectedIncidentInfo({
                  id: sh.id,
                  name: sh.name,
                  type: 'POSKO EVAKUASI',
                  icon: 'cottage',
                  bg: sh.bg,
                  color: sh.color,
                  text: sh.text,
                  hex: sh.hex,
                  lat: sh.lat,
                  lng: sh.lng,
                  ringkasan: sh.ringkasan,
                  reporterName: sh.reporterName,
                  desc: sh.desc,
                  status: sh.status
                })}
              >
                <div className="w-8 h-8 flex items-center justify-center bg-green-600 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-white text-[18px]">cabin</span>
                </div>
              </AdvancedMarker>
            ))}

            {/* Dynamic Medical Facilities */}
            {showHospitals && hospitals.map((hp) => (
              <AdvancedMarker
                key={hp.id}
                position={{ lat: hp.lat, lng: hp.lng }}
                onClick={() => setSelectedIncidentInfo({
                  id: hp.id,
                  name: hp.name,
                  type: 'FASILITAS MEDIS',
                  icon: 'local_hospital',
                  bg: hp.bg,
                  color: hp.color,
                  text: hp.text,
                  hex: hp.hex,
                  lat: hp.lat,
                  lng: hp.lng,
                  ringkasan: hp.ringkasan,
                  reporterName: hp.reporterName,
                  desc: hp.desc,
                  status: hp.status
                })}
              >
                <div className="w-8 h-8 flex items-center justify-center bg-teal-700 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform zoom-in">
                  <span className="material-symbols-outlined text-white text-[18px]">local_hospital</span>
                </div>
              </AdvancedMarker>
            ))}
          </Map>
        </APIProvider>
      </section>

      {/* Segmented Control Tabs to Separate Reports Owned by Current Account */}
      <section className="flex flex-col gap-2 pb-2 mt-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-black text-neutral-900 dark:text-zinc-100 font-sans tracking-tight uppercase">
            Radar Informasi Darurat
          </h2>
          {activeRadarTab === 'sekitar' && otherReports.length > 0 && (
            <button onClick={() => setShowAll(!showAll)}
              className="text-[#BA1A20] dark:text-red-400 text-xs font-bold uppercase tracking-wider hover:underline cursor-pointer"
            >
              {showAll ? 'Sembunyikan' : 'Lihat Semua'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1 bg-neutral-100 dark:bg-zinc-950 p-1 rounded-2xl border border-neutral-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveRadarTab('sekitar')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
              activeRadarTab === 'sekitar'
                ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white shadow-sm border border-neutral-200 dark:border-zinc-800'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">travel_explore</span>
            <span>Masyarakat Sekitar ({otherReports.length})</span>
          </button>
          
          <button
            onClick={() => setActiveRadarTab('saya')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all relative ${
              activeRadarTab === 'saya'
                ? 'bg-[#BA1A20] text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            <span>Laporan Saya ({myReports.length})</span>
            {myReports.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
            )}
          </button>
        </div>
      </section>

      {/* List Content */}
      <section className="flex flex-col gap-4 pb-8">
        <div className="flex flex-col gap-4">
          {(() => {
            const listToRender = activeRadarTab === 'saya' 
              ? myReports 
              : (showAll ? otherReports : otherReports.slice(0, 2));

            if (listToRender.length === 0) {
              if (activeRadarTab === 'saya') {
                return (
                  <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200 dark:border-zinc-800/80 shadow-sm flex flex-col items-center justify-center gap-2 text-left">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                      <span className="material-symbols-outlined text-2xl">verified</span>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-800 dark:text-zinc-200">Tidak Ada Darurat Aktif Anda</h4>
                    <p className="text-[11px] text-neutral-500 dark:text-zinc-400 max-w-[280px] text-center">
                      Anda belum mengajukan laporan SOS aktif apa pun. Gunakan menu <strong>SOS</strong> jika Anda dalam kondisi darurat.
                    </p>
                  </div>
                );
              }
              return (
                <div className="p-8 text-center text-neutral-500 dark:text-zinc-400 text-xs bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200 dark:border-zinc-800">
                  Tidak ada laporan darurat aktif di sekitar Anda saat ini. Situasi kondusif!
                </div>
              );
            }

            return listToRender.map((item, idx) => {
              const isMyReportCard = activeRadarTab === 'saya';

              if (isMyReportCard) {
                return (
                  <div key={idx} 
                    onClick={() => setSelectedIncidentInfo(item)}
                    className="bg-gradient-to-br from-red-50 to-white dark:from-zinc-900/90 dark:to-zinc-950 p-5 rounded-2xl shadow-[0_8px_30px_rgba(239,68,68,0.08)] border-2 border-red-500/30 dark:border-red-500/20 flex flex-col gap-4 hover:shadow-[0_12px_36px_rgba(239,68,68,0.12)] transition-all cursor-pointer group relative overflow-hidden text-left"
                  >
                    {/* Top Animated Pulse Indicator line */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />
                    
                    {/* Unique Identifier Header */}
                    <div className="flex items-center justify-between mt-1">
                      <span className="flex items-center gap-1.5 bg-[#BA1A20] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                        <span className="material-symbols-outlined text-[12px] animate-bounce-short">notifications_active</span>
                        Laporan Darurat Anda
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                        item.status === 'MENUNGGU' 
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                          : item.status === 'TERTANGANI' 
                            ? 'bg-green-600/10 text-green-600 dark:text-green-400' 
                            : 'bg-blue-600/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3 pl-1">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm`}>
                          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight truncate font-sans">
                            {item.name}
                          </h3>
                          <p className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
                            <span className="material-symbols-outlined text-xs">schedule</span> 
                            {item.time?.includes('T') ? new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : item.time}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Report Summary in Quote Frame */}
                    <div className="bg-red-500/5 dark:bg-rose-950/20 p-3.5 rounded-xl border border-red-500/10 dark:border-red-500/10 flex flex-col gap-2 pl-3">
                      <p className="text-xs text-neutral-800 dark:text-zinc-200 leading-relaxed font-sans font-medium">
                        <span className="font-bold text-[#BA1A20] dark:text-red-400">Pernyataan Masalah (Analisis AI):</span> {item.ringkasan}
                      </p>
                      <div className="flex items-center gap-1.5 text-neutral-500 dark:text-zinc-400 mt-1">
                        <span className="material-symbols-outlined text-[15px] shrink-0">location_on</span>
                        <span className="text-[10px] font-semibold truncate">{item.desc}</span>
                      </div>
                    </div>

                    {/* Personal Progress / Rescue Timeline */}
                    <div className="border-t border-dashed border-red-500/20 pt-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 dark:text-zinc-500 mb-2.5 font-sans leading-none">
                        PROGRES PENANGANAN DISPATCH
                      </p>
                      <div className="grid grid-cols-3 gap-1 relative pl-1">
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            item.status === 'MENUNGGU' || item.status === 'MENUJU_LOKASI' || item.status === 'TERTANGANI'
                              ? 'bg-red-600 text-white' : 'bg-neutral-200 dark:bg-zinc-800 text-neutral-400'
                          }`}>
                            ✓
                          </div>
                          <span className="text-[9px] font-black text-neutral-800 dark:text-zinc-300 mt-1 uppercase whitespace-nowrap">Diterima</span>
                        </div>
                        
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            item.status === 'MENUJU_LOKASI' || item.status === 'TERTANGANI'
                              ? 'bg-blue-600 text-white' : 'bg-neutral-200 dark:bg-zinc-800 text-neutral-400'
                          }`}>
                            {item.status === 'MENUJU_LOKASI' || item.status === 'TERTANGANI' ? '✓' : '2'}
                          </div>
                          <span className="text-[9px] font-black text-neutral-800 dark:text-zinc-300 mt-1 uppercase whitespace-nowrap">Respon Tim</span>
                        </div>

                        <div className="flex flex-col items-center text-center">
                          <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            item.status === 'TERTANGANI'
                              ? 'bg-green-600 text-white' : 'bg-neutral-200 dark:bg-zinc-800 text-neutral-400'
                          }`}>
                            {item.status === 'TERTANGANI' ? '✓' : '3'}
                          </div>
                          <span className="text-[9px] font-black text-neutral-800 dark:text-zinc-300 mt-1 uppercase whitespace-nowrap">Selesai</span>
                        </div>
                      </div>
                    </div>

                    {/* Responder Tracker Panel */}
                    {item.status === 'MENUJU_LOKASI' && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-200/50 dark:border-blue-900/30 flex items-center justify-between gap-3 mt-1">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={item.rescuer?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"} 
                            alt="Rescuer Avatar" 
                            className="w-8 h-8 rounded-full object-cover border-2 border-blue-500" 
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="text-[11px] font-black text-neutral-800 dark:text-white leading-tight">
                              {item.rescuer?.name || "Budi Santoso"}
                            </p>
                            <p className="text-[9px] text-[#2b6cb0] dark:text-blue-400 font-bold mt-0.5">Relawan responder dalam perjalanan</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = "tel:112";
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 hover:bg-blue-700 pointer-events-auto"
                        >
                          <span className="material-symbols-outlined text-[11px]">call</span>
                          TELEPON
                        </button>
                      </div>
                    )}

                    {/* Operational controls for reporter self-resolution */}
                    <div className="flex gap-2.5 mt-1 pl-1">
                      {item.status !== 'TERTANGANI' ? (
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleFinishHelp(item.id);
                          }}
                          className="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-green-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Nyatakan Aman / Selesai
                        </button>
                      ) : (
                        <div className="flex-1 bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider flex justify-center items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">verified</span>
                          <span>Laporan Selesai Ditangani</span>
                        </div>
                      )}
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = "tel:112";
                        }}
                        className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950/20 dark:text-red-400 transition-colors shadow-sm"
                        title="Hubungi Layanan Darurat Utama"
                      >
                        <span className="material-symbols-outlined text-[18px]">call</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} 
                  onClick={() => setSelectedIncidentInfo(item)}
                  className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-neutral-200 dark:border-zinc-800 flex flex-col gap-4 hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-all cursor-pointer group relative overflow-hidden text-left"
                >
                  {/* Highlight bar for urgency */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${item.bg.replace('/10', '').replace('bg-surface-container-highest', 'bg-neutral-300')}`} />
                  
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between pl-2 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-full ${item.bg} ${item.text} flex items-center justify-center shrink-0`}>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-tight truncate font-sans">{item.name}</h3>
                        <p className="text-[11px] font-medium text-neutral-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
                          <span className="material-symbols-outlined text-xs">schedule</span> 
                          {item.time?.includes('T') ? new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : item.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center sm:items-end justify-between gap-2 shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${item.status === 'MENUNGGU' ? 'bg-red-500/10 text-red-500' : item.status === 'TERTANGANI' ? 'bg-green-600/11 text-green-600' : 'bg-blue-600/11 text-blue-600'}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 pl-2">
                    <p className="text-xs text-neutral-600 dark:text-zinc-350 leading-relaxed font-sans">
                      <span className="font-bold text-neutral-900 dark:text-white">{item.reporterName}</span> melaporkan: {item.ringkasan}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 bg-neutral-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-neutral-200 dark:border-zinc-800/80">
                      <span className="material-symbols-outlined text-[15px] text-neutral-400 shrink-0">location_on</span> 
                      <span className="text-[11px] font-semibold text-neutral-500 dark:text-zinc-350 truncate">{item.desc}</span>
                    </div>
                  </div>

                  {/* Relawan tracker inside reports owned by the logged-in user */}
                  {activeRadarTab === 'saya' && item.status === 'MENUJU_LOKASI' && (
                    <div className="mt-1 border-t border-dashed border-neutral-200 dark:border-zinc-800 pt-3 bg-neutral-50 dark:bg-zinc-950/40 -mx-5 -mb-5 p-5 rounded-b-2xl">
                       <div className="flex items-center justify-between gap-3 text-left">
                         <div className="flex items-center gap-2.5">
                           <div className="relative shrink-0">
                             <img 
                               src={item.rescuer?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"} 
                               alt="Rescuer Avatar" 
                               className="w-8 h-8 rounded-full object-cover border border-red-500" 
                               referrerPolicy="no-referrer"
                             />
                             <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-white flex items-center justify-center rounded-full text-[8px] font-black leading-none bg-green-600 border border-white">
                               ✓
                             </span>
                           </div>
                           <div>
                             <p className="text-[11px] font-bold text-neutral-800 dark:text-white leading-tight">
                               {item.rescuer?.name || "Budi Santoso"} (Relawan Responder)
                             </p>
                             <p className="text-[10px] text-neutral-500 dark:text-zinc-400 mt-0.5">Sedang Menuju ke Koordinat Anda</p>
                           </div>
                         </div>
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             window.location.href = "tel:112";
                           }}
                           className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wide flex items-center gap-1 hover:bg-emerald-700 pointer-events-auto"
                         >
                           <span className="material-symbols-outlined text-[12px]">call</span>
                           Hubungi
                         </button>
                       </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2 pl-2">
                    {item.status === 'MENUNGGU' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAccept(item.id, item.lat, item.lng);
                        }}
                        className="flex-1 min-w-0 bg-[#BA1A20] text-white py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-red-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px] shrink-0">directions_run</span>
                        <span className="truncate">Ambil Tindakan</span>
                      </button>
                    )}
                    {item.status === 'MENUJU_LOKASI' && (
                      <div className="flex-1 min-w-0 bg-red-100 text-[#BA1A20] dark:bg-red-950/20 dark:text-red-400 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider flex justify-center items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] animate-pulse shrink-0">directions_car</span>
                        <span className="truncate">Relawan Menuju Lokasi</span>
                      </div>
                    )}
                    {item.status === 'TERTANGANI' && (
                      <div className="flex-1 min-w-0 bg-green-50 text-green-700 dark:bg-green-950/10 dark:text-green-400 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider flex justify-center items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] shrink-0">verified</span>
                        <span className="truncate">Selesai Ditangani</span>
                      </div>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = "tel:112";
                      }}
                      className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors shadow-sm"
                      title="Hubungi Darurat"
                    >
                      <span className="material-symbols-outlined text-[18px]">call</span>
                    </button>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </section>

      {/* Incident Detail Dialog overlay */}
      {selectedIncidentInfo && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedIncidentInfo(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-neutral-200 dark:border-zinc-805 text-left" onClick={(e) => e.stopPropagation()}>
            <div className={`p-4 ${selectedIncidentInfo.bg} ${selectedIncidentInfo.color} flex justify-between items-center`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">{selectedIncidentInfo.icon}</span>
                <h3 className="text-xs font-bold uppercase tracking-wider">{selectedIncidentInfo.type}</h3>
              </div>
              <button 
                onClick={() => setSelectedIncidentInfo(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-black/10 hover:bg-black/20"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
               <div>
                 <span className="text-[10px] text-neutral-400 block mb-0.5 uppercase tracking-wider">Pelapor</span>
                 <p className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">{selectedIncidentInfo.reporterName}</p>
               </div>
               
               <div>
                 <span className="text-[10px] text-neutral-400 block mb-0.5 uppercase tracking-wider">Ringkasan Masalah (Analisis AI)</span>
                 <p className="text-xs text-neutral-700 dark:text-zinc-200 bg-neutral-50 dark:bg-zinc-950 p-3 rounded-xl border border-neutral-200 dark:border-zinc-805 leading-relaxed font-sans">
                    {selectedIncidentInfo.ringkasan || "Tidak ada detail yang diberikan."}
                 </p>
               </div>
               
               {selectedIncidentInfo.type !== 'POSKO EVAKUASI' && selectedIncidentInfo.type !== 'FASILITAS MEDIS' ? (
                 <div>
                   <span className="text-[10px] text-neutral-400 block mb-0.5 uppercase tracking-wider">Kontak Darurat Pelapor</span>
                   <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-850 rounded-xl">
                      <div className="flex flex-col">
                         <span className="font-bold text-xs text-neutral-800 dark:text-white">Keluarga</span>
                         <span className="text-[11px] text-neutral-500">0812-XXXX-XXXX</span>
                      </div>
                      <button className="w-8 h-8 rounded-full bg-red-100 text-[#BA1A20] flex items-center justify-center" onClick={() => window.location.href = "tel:08123456789"}>
                         <span className="material-symbols-outlined text-sm">call</span>
                      </button>
                   </div>
                 </div>
               ) : (
                 <div>
                   <span className="text-[10px] text-neutral-400 block mb-0.5 uppercase tracking-wider">Lembaga Penanggung Jawab</span>
                   <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-850 rounded-xl">
                      <div className="flex flex-col text-left">
                         <span className="font-bold text-xs text-neutral-800 dark:text-white">{selectedIncidentInfo.reporterName}</span>
                         <span className="text-[10px] font-medium text-neutral-500 mt-0.5">Hotline Mitigasi Darurat</span>
                      </div>
                      <button className="w-8 h-8 rounded-full bg-red-100 text-[#BA1A20] flex items-center justify-center focus:outline-none" onClick={() => window.location.href = "tel:112"}>
                         <span className="material-symbols-outlined text-sm">call</span>
                      </button>
                   </div>
                 </div>
               )}

               <button 
                 onClick={() => {
                   if (selectedIncidentInfo.status === 'MENUNGGU') {
                     handleAccept(selectedIncidentInfo.id, selectedIncidentInfo.lat, selectedIncidentInfo.lng);
                   } else {
                     setActiveDestination({ lat: selectedIncidentInfo.lat, lng: selectedIncidentInfo.lng });
                      setActiveDestinationName(selectedIncidentInfo.name || selectedIncidentInfo.type);
                      setActiveIncidentId(selectedIncidentInfo.id);
                      setIsNavigating(true);
                   }
                   setSelectedIncidentInfo(null);
                 }}
                 className="w-full bg-[#BA1A20] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider mt-2 hover:bg-red-700 transition-colors shadow-sm"
               >
                 Tampilkan Rute ke Lokasi
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
