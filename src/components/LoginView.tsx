import React, { useState } from 'react';
import { loginWithGoogle } from '../firebase';
import TermsPrivacyModal from './TermsPrivacyModal';

export default function LoginView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'terms' | 'privacy'>('terms');

  const handleOpenModal = (type: 'terms' | 'privacy') => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      // the onAuthStateChanged in App.tsx will handle the state update
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal masuk. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 w-full overflow-hidden bg-surface dark:bg-zinc-950 text-on-surface dark:text-zinc-50">
      {/* Premium Background Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 dark:bg-primary/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-tertiary/20 dark:bg-tertiary/10 rounded-full blur-[150px] mix-blend-multiply dark:mix-blend-lighten animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-error/15 dark:bg-error/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-lighten animate-pulse" style={{ animationDuration: '12s', animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-10 animate-fade-in bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl p-10 rounded-[40px] shadow-[0_24px_80px_rgba(0,0,0,0.07)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5)] border border-white/50 dark:border-zinc-700/50 relative z-10">
        <div className="text-center flex flex-col items-center relative z-10">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-primary/20 dark:bg-primary/30 rounded-full blur-xl scale-110 group-hover:scale-125 transition-transform duration-500"></div>
            <img 
              src="/logo.svg" 
              alt="Wirasaga App Icon" 
              className="w-28 h-28 rounded-3xl shadow-xl relative z-10 group-hover:-translate-y-1 transition-transform duration-500 object-cover border-4 border-white dark:border-zinc-800"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-white mb-3 tracking-tight">Wirasaga</h1>
          <p className="text-body-lg text-neutral-500 dark:text-zinc-400 font-medium">
            Sistem Kesiapsiagaan &<br/>Tanggap Darurat Nasional
          </p>
        </div>

        <div className="flex flex-col gap-6 relative z-10 mt-4">
          {error && (
            <div className="bg-error-container/80 backdrop-blur text-on-error-container p-4 rounded-2xl text-body-md text-center border border-error/20 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-error">error</span>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <button 
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full relative group overflow-hidden bg-white dark:bg-zinc-950 text-neutral-900 dark:text-white py-4 px-6 rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 shadow-sm border border-neutral-200 dark:border-zinc-800 hover:shadow-md hover:border-neutral-300 dark:hover:border-zinc-700 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 dark:from-white/0 dark:via-white/5 dark:to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
              <div className="flex items-center justify-center gap-3 relative z-10">
                {isLoading ? (
                  <span className="material-symbols-outlined animate-spin text-[24px]">autorenew</span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform duration-300">
                      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                      </g>
                    </svg>
                    <span className="tracking-wide">Lanjutkan dengan Google</span>
                  </>
                )}
              </div>
            </button>
            <p className="text-xs text-center text-neutral-500 dark:text-zinc-500 font-medium px-2 leading-relaxed">
              Dengan masuk, Anda menyetujui<br/>
              <button type="button" onClick={() => handleOpenModal('terms')} className="text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors focus:outline-none">Ketentuan Layanan</button>
              {' '}dan{' '}
              <button type="button" onClick={() => handleOpenModal('privacy')} className="text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors focus:outline-none">Kebijakan Privasi</button> kami.
            </p>
          </div>
        </div>
      </div>
      
      <TermsPrivacyModal 
        isOpen={modalOpen} 
        type={modalType} 
        onClose={() => setModalOpen(false)} 
      />
    </div>
  );
}
