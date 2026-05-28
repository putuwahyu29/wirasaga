import React, { useState } from 'react';
import { loginWithGoogle } from '../firebase';

export default function LoginView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="bg-background dark:bg-zinc-950 text-on-background dark:text-zinc-50 min-h-screen flex items-center justify-center p-6 w-full max-w-lg mx-auto shadow-2xl">
      <div className="w-full max-w-md flex flex-col gap-10 animate-fade-in bg-surface dark:bg-zinc-900 p-8 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-outline-variant/20 dark:border-zinc-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-tertiary/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

        <div className="text-center flex flex-col items-center relative z-10">
          <img 
            src="/logo.svg" 
            alt="Wirasaga App Icon" 
            className="w-24 h-24 rounded-[28px] mb-6 shadow-lg rotate-3 hover:rotate-0 transition-transform duration-300 object-cover"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-display-sm font-display-sm font-bold text-on-surface dark:text-white mb-3 tracking-tight">Wirasaga</h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant dark:text-zinc-350 max-w-[280px]">
            Sistem Kesiapsiagaan & Tanggap Darurat Nasional
          </p>
        </div>

        <div className="flex flex-col gap-6 relative z-10">
          {error && (
            <div className="bg-error-container/80 backdrop-blur text-on-error-container p-4 rounded-2xl text-body-md text-center border border-error/20 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-error">error</span>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-surface-container-lowest dark:bg-zinc-950 hover:bg-surface-container-low dark:hover:bg-zinc-900 text-on-surface dark:text-zinc-200 py-4 px-6 rounded-2xl font-title-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-4 shadow-sm border border-outline-variant dark:border-zinc-800 hover:border-outline hover:shadow-md group cursor-pointer"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-[24px]">autorenew</span>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                    </g>
                  </svg>
                  <span className="font-bold">Lanjutkan dengan Google</span>
                </>
              )}
            </button>
            <p className="text-label-sm text-center text-on-surface-variant dark:text-zinc-400 font-medium px-4 mt-2">
              Dengan melanjutkan, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
