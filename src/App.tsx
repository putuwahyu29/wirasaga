import React, { useState, useEffect, useRef } from 'react';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import RadarSekitarView from './components/RadarSekitarView';
import TeleponView from './components/TeleponView';
import SettingsView from './components/SettingsView';
import EditProfileView from './components/EditProfileView';
import ChatModal from './components/ChatModal';
import LoginView from './components/LoginView';
import PermissionsScreen from './components/PermissionsScreen';
import ToolkitView from './components/ToolkitView';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { auth, logoutUser, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { requestForToken, registerOnMessageListener } from './firebase';
import { collection, doc, setDoc, query, onSnapshot } from 'firebase/firestore';

import { Toaster, toast } from 'sonner';

const playNotifyBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Beep 1
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // Note A5
    gain1.gain.setValueAtTime(0, audioCtx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.18);

    // Beep 2 (offset)
    setTimeout(() => {
      try {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.setValueAtTime(1174.66, audioCtx.currentTime); // Note D6
        gain2.gain.setValueAtTime(0, audioCtx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.18);
      } catch {}
    }, 120);
  } catch (error) {
    console.log('Audio feedback skipped (User interaction needed first):', error);
  }
};

const playNotifySiren = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 0.5);
    oscillator.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 1.0);
    oscillator.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 1.5);
    oscillator.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 2.0);
    
    gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 2.6);
  } catch (err) {
    console.log("Audio notification siren skipped:", err);
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState<'sos' | 'radar' | 'toolkit' | 'telepon' | 'pengaturan'>('sos');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Looping global alarm state for receiving emergencies
  const [isGlobalAlarmPlaying, setIsGlobalAlarmPlaying] = useState(false);
  const globalAlarmAudioCtxRef = useRef<AudioContext | null>(null);
  const globalAlarmOscillatorRef1 = useRef<OscillatorNode | null>(null);
  const globalAlarmOscillatorRef2 = useRef<OscillatorNode | null>(null);
  const globalAlarmLfoRef = useRef<OscillatorNode | null>(null);
  const globalAlarmGainRef = useRef<GainNode | null>(null);

  const startGlobalAlarm = () => {
    try {
      if (globalAlarmAudioCtxRef.current) return;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      globalAlarmAudioCtxRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      // Setup swooping dual high-intensity sirens (unmistakable emergency alarms)
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

      globalAlarmOscillatorRef1.current = osc1;
      globalAlarmOscillatorRef2.current = osc2;
      globalAlarmLfoRef.current = lfo;
      globalAlarmGainRef.current = gain;
      setIsGlobalAlarmPlaying(true);
    } catch (err) {
      console.error("Failed to play global alert siren:", err);
    }
  };

  const stopGlobalAlarm = () => {
    try {
      if (globalAlarmOscillatorRef1.current) {
        globalAlarmOscillatorRef1.current.stop();
        globalAlarmOscillatorRef1.current.disconnect();
        globalAlarmOscillatorRef1.current = null;
      }
      if (globalAlarmOscillatorRef2.current) {
        globalAlarmOscillatorRef2.current.stop();
        globalAlarmOscillatorRef2.current.disconnect();
        globalAlarmOscillatorRef2.current = null;
      }
      if (globalAlarmLfoRef.current) {
        globalAlarmLfoRef.current.stop();
        globalAlarmLfoRef.current.disconnect();
        globalAlarmLfoRef.current = null;
      }
      if (globalAlarmGainRef.current) {
        globalAlarmGainRef.current.disconnect();
        globalAlarmGainRef.current = null;
      }
      if (globalAlarmAudioCtxRef.current) {
        globalAlarmAudioCtxRef.current.close();
        globalAlarmAudioCtxRef.current = null;
      }
      setIsGlobalAlarmPlaying(false);
    } catch (e) {
      console.error("Failed to stop global alert siren:", e);
    }
  };
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(() => {
    return localStorage.getItem('wirasaga_permissions_handled') === 'true';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  
  // Profile state
  const [profile, setProfile] = useState({
    name: "Aan Wijaya",
    email: "aan.wijaya@example.com",
    phone: "+62 812 3456 7890",
    bloodType: "O",
    allergies: "Penisilin, Kacang",
    medicalHistory: "Asma",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDiH4QrOzY-72Wwj0iGsSLIDJUVU_z7kdWhEM0rtjqlpeBTUXJLgBI69QSNdvrZLf0OByabHaepAh9ZC3oPHETSV2gCApsjcoeknESgIfCMVOblQgxRA822mmXnZl17zYmHg448vZVNTSYyF5-NEF01ApVxaqq-z4mozPfCksS5v_dsRxYYP71jiHCXe9KYSRd98wvXV8d-0f9u5CFgB8gC3cRv84Wr3l2bI9OalSIF9T1_qHymH9ygmxKikolcF2Dti_5zUrSMRYMO"
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setProfile(prev => ({
          ...prev,
          name: currentUser.displayName || "Aan Wijaya",
          email: currentUser.email || "aan.wijaya@example.com",
          avatar: currentUser.photoURL || prev.avatar
        }));
        
        // FCM token request when user is logged in
        let fcmToken: string | null = null;
        if (permissionsGranted) {
          fcmToken = await requestForToken();
        }

        // Register user profile & FCM token in Firestore users entry
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(userDocRef, {
            name: currentUser.displayName || "Aan Wijaya",
            email: currentUser.email || "aan.wijaya@example.com",
            photoURL: currentUser.photoURL || null,
            fcmToken: fcmToken,
            lastActive: new Date()
          }, { merge: true });
          console.log("Registered user & FCM token in Firestore entry successfully.");
        } catch (dbErr) {
          console.warn("Could not register user entry in Firestore:", dbErr);
        }
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, [permissionsGranted]);

  useEffect(() => {
    if (permissionsGranted && user) {
      console.log('Registering continuous FCM foreground message listener...');
      const unsubscribe = registerOnMessageListener((payload: any) => {
        console.log('Foreground FCM Message received:', payload);
        
        // Play highly optimized, lightweight synthesized double-beep notification sound
        playNotifyBeep();

        // Show elegant high-contrast emergency-colored toast
        toast.error(payload?.notification?.title || 'SIAGA DARURAT', {
          description: payload?.notification?.body || 'Menerima koordinasi evakuasi & bencana baru.',
          position: 'top-center',
          duration: 6000,
          action: {
            label: 'LIHAT RADAR',
            onClick: () => {
              setCurrentView('radar');
            }
          }
        });
      });

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [permissionsGranted, user]);


  useEffect(() => {
    // Apply accessibility classes to document body
    if (highContrast) document.body.classList.add('contrast-more');
    else document.body.classList.remove('contrast-more');
    
    if (largeText) document.body.classList.add('text-lg');
    else document.body.classList.remove('text-lg');
  }, [highContrast, largeText]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Real-time global background incident scanner & siren alerts
  useEffect(() => {
    if (!user) return;
    
    console.log("Initializing real-time Firestore background incident listener...");
    const q = query(collection(db, "incidents"));
    let knownIncidentIds = new Set<string>();
    let isFirstLoad = true;
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let playGlobalAlarm = false;
      let alertItemData: any = null;
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const docId = change.doc.id;
          const data = change.doc.data();
          
          if (!isFirstLoad && !knownIncidentIds.has(docId)) {
            // Trigger alert if it's not our own incident and the status is MENUNGGU
            if (data.reporter_uid !== user.uid && data.status === 'MENUNGGU') {
              playGlobalAlarm = true;
              alertItemData = data;
            }
          }
          knownIncidentIds.add(docId);
        }
      });
      
      isFirstLoad = false;
      
      if (playGlobalAlarm && alertItemData) {
        console.log("ALERT! Real-time background incident detected:", alertItemData);
        // Play the unmistakable emergency alert siren continuously
        startGlobalAlarm();
        
        // Show prominent Sonner action-toast globally
        toast.error(`ALARM DARURAT: ${alertItemData.kategori}`, {
          description: `Seseorang (${alertItemData.reporter_name || 'Korban'}) membutuhkan pertolongan segera: ${alertItemData.ringkasan_masalah || 'Segera berikan bantuan.'}`,
          position: 'top-center',
          duration: 15000,
          action: {
            label: 'BUKA RADAR',
            onClick: () => {
              setCurrentView('radar');
              stopGlobalAlarm();
            }
          }
        });
      }
    });
    
    return () => {
      unsubscribe();
      stopGlobalAlarm();
    };
  }, [user]);

  if (authChecking) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">autorenew</span>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (!permissionsGranted) {
    return (
      <PermissionsScreen 
        onAllGranted={() => {
          localStorage.setItem('wirasaga_permissions_handled', 'true');
          setPermissionsGranted(true);
        }} 
      />
    );
  }

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentView('sos');
    } catch (error) {
      console.error(error);
    }
  };

  const renderView = () => {
    if (isEditingProfile) {
      return <EditProfileView 
        profile={profile} 
        setProfile={setProfile} 
        onBack={() => setIsEditingProfile(false)} 
      />;
    }

    switch (currentView) {
      case 'sos':
        return <DashboardView profile={profile} user={user} />;
      case 'radar':
        return <RadarSekitarView profile={profile} />;
      case 'toolkit':
        return <ToolkitView />;
      case 'telepon':
        return <TeleponView />;
      case 'pengaturan':
        return <SettingsView 
          profile={profile}
          onEditProfile={() => setIsEditingProfile(true)} 
          onLogout={handleLogout}
          highContrast={highContrast}
          setHighContrast={setHighContrast}
          largeText={largeText}
          setLargeText={setLargeText}
          theme={theme}
          setTheme={setTheme}
        />;
      default:
        return <DashboardView profile={profile} user={user} />;
    }
  };

  return (
    <div className="bg-surface-dim dark:bg-zinc-900 min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background dark:bg-zinc-950 text-on-background dark:text-zinc-50 h-[100dvh] flex flex-col font-sans relative w-full md:max-w-2xl lg:max-w-4xl xl:max-w-6xl shadow-2xl overflow-hidden md:border-x md:border-surface-variant/30 dark:border-zinc-800 flex-1">
        {!isEditingProfile && !isChatOpen && <Header avatar={profile.avatar} onProfileClick={() => { setCurrentView('pengaturan'); }} />}
        
        {isGlobalAlarmPlaying && (
          <div className="bg-red-600 dark:bg-rose-700 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 animate-pulse font-sans z-50 border-b border-red-700 shadow-lg shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined filled text-white animate-bounce-short">notifications_active</span>
              <span className="text-xs md:text-sm font-black tracking-wide">PANGGILAN DARURAT: Seseorang butuh bantuan segera!</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setCurrentView('radar');
                  stopGlobalAlarm();
                }}
                className="bg-white text-red-700 px-3 py-1 text-[11px] font-black rounded hover:bg-neutral-100 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                BUKA RADAR
              </button>
              <button 
                onClick={stopGlobalAlarm}
                className="bg-red-900/80 text-white border border-red-400/30 px-3 py-1 text-[11px] font-black rounded hover:bg-red-900 transition-all cursor-pointer active:scale-95"
              >
                MATIKAN SIRENE
              </button>
            </div>
          </div>
        )}
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar relative w-full">
          {renderView()}
        </main>

        {!isEditingProfile && !isChatOpen && (
          <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
        )}

        {/* Floating Action Button for Chat */}
        {!isEditingProfile && !isChatOpen && (
          <div className="absolute bottom-[92px] md:bottom-[104px] right-6 z-40 pointer-events-auto">
            <button 
              onClick={() => setIsChatOpen(true)}
              className="w-14 h-14 bg-primary text-on-primary rounded-[16px] shadow-[0_8px_24px_rgba(175,16,26,0.5)] flex items-center justify-center hover:bg-primary-container hover:-translate-y-1 transition-all active:scale-95"
              aria-label="Chat AI Assistant"
            >
              <span className="material-symbols-outlined filled text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
            </button>
          </div>
        )}

        {/* Chat Modal */}
        {isChatOpen && (
          <div className="absolute inset-0 z-50 bg-background flex flex-col h-full w-full">
            <ChatModal onClose={() => setIsChatOpen(false)} />
          </div>
        )}
        <Toaster />
        <PWAInstallPrompt />
      </div>
    </div>
  );
}
