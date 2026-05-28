import React, { useState, useEffect } from 'react';
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
import { auth, logoutUser } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { requestForToken, onMessageListener } from './firebase';

import { Toaster, toast } from 'sonner';

export default function App() {
  const [currentView, setCurrentView] = useState<'sos' | 'radar' | 'toolkit' | 'telepon' | 'pengaturan'>('sos');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setProfile(prev => ({
          ...prev,
          name: currentUser.displayName || "Aan Wijaya",
          email: currentUser.email || "aan.wijaya@example.com",
          avatar: currentUser.photoURL || prev.avatar
        }));
        
        // FCM token request when user is logged in
        if (permissionsGranted) {
            requestForToken();
        }
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, [permissionsGranted]);

  useEffect(() => {
    if (permissionsGranted && user) {
        onMessageListener().then((payload: any) => {
            toast.info(payload?.notification?.title || 'Notifikasi Baru', {
                description: payload?.notification?.body || 'Pesab masuk.',
                position: 'top-center'
            });
        }).catch((err) => console.log('failed: ', err));
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
    return <PermissionsScreen onAllGranted={() => setPermissionsGranted(true)} />;
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
        return <DashboardView profile={profile} />;
      case 'radar':
        return <RadarSekitarView />;
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
        return <DashboardView profile={profile} />;
    }
  };

  return (
    <div className="bg-surface-dim dark:bg-zinc-900 min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background dark:bg-zinc-950 text-on-background dark:text-zinc-50 h-[100dvh] flex flex-col font-sans relative w-full md:max-w-2xl lg:max-w-4xl xl:max-w-6xl shadow-2xl overflow-hidden md:border-x md:border-surface-variant/30 dark:border-zinc-800 flex-1">
        {!isEditingProfile && !isChatOpen && <Header avatar={profile.avatar} onProfileClick={() => { setIsEditingProfile(true); }} />}
        
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
      </div>
    </div>
  );
}
