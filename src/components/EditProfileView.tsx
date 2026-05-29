import React, { useState } from 'react';
import { toast } from 'sonner';

interface EditProfileViewProps {
  onBack: () => void;
  profile: any;
  setProfile: (p: any) => void;
}

export default function EditProfileView({ onBack, profile, setProfile }: EditProfileViewProps) {
  const [isSaved, setIsSaved] = useState(false);
  
  // Local state for editing fields
  const [formData, setFormData] = useState({ ...profile });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    // Form Validation
    if (!formData.name || formData.name.length < 3) {
      toast.error('Nama lengkap minimal 3 karakter', { position: 'top-center' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      toast.error('Format email tidak valid', { position: 'top-center' });
      return;
    }
    const phoneRegex = /^[0-9+\-\s]{8,20}$/;
    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      toast.error('Nomor telepon tidak valid', { position: 'top-center' });
      return;
    }

    setIsSaved(true);
    setProfile(formData);
    toast.success('Profil berhasil diperbarui', { position: 'top-center' });
    setTimeout(() => {
      setIsSaved(false);
      onBack();
    }, 1500);
  };

  const [showKYCModal, setShowKYCModal] = useState(false);
  const [kycStep, setKycStep] = useState<'ktp' | 'liveness' | 'processing'>('ktp');

  const handleKYC = () => {
    if (kycStep === 'ktp') {
      setKycStep('liveness');
    } else if (kycStep === 'liveness') {
      setKycStep('processing');
      setTimeout(() => {
        setFormData((prev: any) => ({ ...prev, kycVerified: true, trustScore: (prev.trustScore || 70) + 15 }));
        toast.success('Identitas terverifikasi secara hukum. Skor reputasi meningkat.', { position: 'top-center' });
        setShowKYCModal(false);
        setKycStep('ktp');
      }, 3000);
    }
  };

  return (
    <div className="bg-background dark:bg-zinc-950 text-on-background dark:text-zinc-50 min-h-screen font-body-lg font-sans antialiased pb-24 animate-fade-in absolute inset-0 z-50">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-surface dark:bg-zinc-900 text-on-surface dark:text-white w-full px-4 py-3 flex items-center justify-between border-b border-surface-variant/50 dark:border-zinc-800 max-w-lg mx-auto">
        <div className="flex items-center">
          <button 
            onClick={onBack}
            aria-label="Go back" 
            className="p-2 -ml-2 rounded-full hover:bg-surface-container-highest dark:hover:bg-zinc-800 transition-colors flex items-center justify-center text-on-surface dark:text-zinc-100 cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="ml-2 font-title-lg text-title-lg text-on-surface dark:text-zinc-50 font-sans font-bold">Edit Profil</h1>
        </div>
      </header>

      <main className="w-full max-w-lg mx-auto px-margin-mobile pt-stack-gap-md pb-stack-gap-md flex flex-col gap-6">
        {/* Profile Picture Edit */}
        <div className="flex flex-col items-center relative pt-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-surface-container-high border-4 border-surface shadow-sm">
              <img 
                alt="Profile" 
                className="w-full h-full object-cover" 
                src={formData.avatar}
              />
            </div>
            <button 
              aria-label="Edit profile picture" 
              className="absolute bottom-0 right-0 bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:bg-primary-container hover:text-on-primary-container transition-colors border-2 border-surface active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            </button>
          </div>
        </div>

        {/* Personal Information Section */}
        <section>
          <h2 className="font-title-md text-title-md text-on-surface-variant mb-4 px-1">Informasi Pribadi</h2>
          <div className="flex flex-col gap-4">
            <div className="m3-text-field with-icon">
              <input id="name" placeholder=" " type="text" value={formData.name} onChange={handleChange} />
              <label className="font-body-lg" htmlFor="name">Nama Lengkap</label>
              <span className="material-symbols-outlined leading-icon">person</span>
            </div>

            <div className="m3-text-field with-icon">
              <input id="email" placeholder=" " type="email" value={formData.email} onChange={handleChange} />
              <label className="font-body-lg" htmlFor="email">Email</label>
              <span className="material-symbols-outlined leading-icon">mail</span>
            </div>

            <div className="m3-text-field with-icon">
              <input id="phone" placeholder=" " type="tel" value={formData.phone} onChange={handleChange} disabled={true} className="opacity-70" />
              <label className="font-body-lg" htmlFor="phone">Nomor Telepon (OTP Verified)</label>
              <span className="material-symbols-outlined leading-icon">call</span>
            </div>
          </div>
        </section>

        {/* Identitas Terverifikasi (KYC) */}
        <section>
          <h2 className="font-title-md text-title-md text-on-surface-variant mb-4 px-1 flex items-center gap-2">
            Verifikasi Identitas & e-KTP <span className="material-symbols-outlined text-green-600 text-[18px]">verified</span>
          </h2>
          <div className="bg-surface-container-low p-4 rounded-xl border border-surface-variant flex flex-col gap-4">
            <p className="text-sm text-on-surface-variant font-sans">
              Berdasarkan UU ITE, verifikasi identitas (KYC) diwajibkan untuk mencegah laporan palsu dan prank.
            </p>
            
            <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-lg border border-neutral-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-neutral-400">phone_iphone</span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-neutral-800 dark:text-zinc-200">Verifikasi OTP (WhatsApp)</span>
                  <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Terverifikasi</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-green-600">check_circle</span>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg border ${formData.kycVerified ? "bg-white dark:bg-zinc-900 border-neutral-200 dark:border-zinc-800" : "bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30"}`}>
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${formData.kycVerified ? "text-neutral-400" : "text-red-500"}`}>badge</span>
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${formData.kycVerified ? "text-neutral-800 dark:text-zinc-200" : "text-red-800 dark:text-red-400"}`}>Verifikasi e-KTP & Foto Wajah</span>
                  {formData.kycVerified ? (
                    <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Identitas Valid</span>
                  ) : (
                    <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Belum Verifikasi</span>
                  )}
                </div>
              </div>
              {formData.kycVerified ? (
                <span className="material-symbols-outlined text-green-600">check_circle</span>
              ) : (
                <button 
                  onClick={() => setShowKYCModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  Mulai KYC
                </button>
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-lg border border-neutral-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-neutral-400">military_tech</span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-neutral-800 dark:text-zinc-200">Trust Score (Reputasi)</span>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Skor Kredibilitas Pelapor</span>
                </div>
              </div>
              <span className={`font-black text-sm ${formData.trustScore > 80 ? 'text-green-600' : 'text-amber-500'}`}>{formData.trustScore || 70}%</span>
            </div>
          </div>
        </section>

        {/* Medical Information Section */}
        <section>
          <h2 className="font-title-md text-title-md text-on-surface-variant mb-4 px-1 flex items-center flex-wrap gap-2">
            Informasi Medis <span className="text-error text-sm font-bold bg-error-container px-2 py-0.5 rounded-full">*Penting untuk Darurat</span>
          </h2>
          <div className="flex flex-col gap-4">
            <div className="m3-text-field with-icon">
              <select id="bloodType" value={formData.bloodType} onChange={handleChange} className="w-full bg-transparent outline-none">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="Tidak Tahu">Tidak Tahu</option>
              </select>
              <label className="font-body-lg" htmlFor="bloodType">Golongan Darah</label>
              <span className="material-symbols-outlined leading-icon text-primary">bloodtype</span>
            </div>

            <div className="m3-text-field with-icon">
              <input id="allergies" placeholder=" " type="text" value={formData.allergies} onChange={handleChange} />
              <label className="font-body-lg" htmlFor="allergies">Alergi (Pisahkan dengan koma)</label>
              <span className="material-symbols-outlined leading-icon text-primary">allergy</span>
            </div>

            <div className="m3-text-field with-icon">
              <input id="medicalHistory" placeholder=" " type="text" value={formData.medicalHistory} onChange={handleChange} />
              <label className="font-body-lg" htmlFor="medicalHistory">Riwayat Penyakit Khusus</label>
              <span className="material-symbols-outlined leading-icon text-primary">medical_information</span>
            </div>
          </div>
          <p className="mt-3 text-label-md font-label-md text-on-surface-variant flex gap-2 items-start bg-surface-container-low p-3 rounded-xl border border-primary/20">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0">lock</span>
              <span>Informasi profil dan medis ini <strong className="text-on-surface">sangat rahasia</strong>. Hanya <strong>1 Relawan Pertama</strong> yang mengambil tindakan bantuan Anda yang dapat melihat informasi ini untuk keperluan penanganan medis darurat.</span>
          </p>
        </section>
        
        {/* Save Button Section */}
        <section className="mt-4 pb-12">
          <button 
            onClick={handleSave}
            className="w-full bg-primary text-on-primary hover:bg-primary/90 transition-colors py-4 rounded-xl text-title-md font-title-md flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
          >
            {isSaved ? <span className="material-symbols-outlined">check_circle</span> : null}
            {isSaved ? 'Tersimpan' : 'Simpan Perubahan'}
          </button>
        </section>
      </main>

      {/* KYC Modal Overlay */}
      {showKYCModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center animate-scale-up">
            <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tight font-sans mb-1">
              Verifikasi e-KTP & Liveness
            </h3>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 font-sans mb-6">
              Sesuai hukum yang berlaku, identitas Anda akan direkam dengan aman untuk mencegah penyalahgunaan darurat palsu.
            </p>

            {kycStep === 'ktp' && (
              <div className="flex flex-col gap-4">
                <div className="aspect-[1.6/1] bg-neutral-100 dark:bg-zinc-800 rounded-xl border-2 border-dashed border-neutral-300 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-200 dark:hover:bg-zinc-750 transition-colors">
                  <span className="material-symbols-outlined text-4xl text-neutral-400 mb-2">badge</span>
                  <span className="text-xs font-bold text-neutral-600 dark:text-zinc-300">Tap untuk Ambil Foto e-KTP</span>
                  <span className="text-[9px] text-neutral-400 mt-1">Pastikan tulisan terbaca jelas dan tidak silau</span>
                </div>
                <button onClick={handleKYC} className="w-full bg-emerald-600 text-white rounded-xl py-3 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                  Lanjutkan <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            )}

            {kycStep === 'liveness' && (
              <div className="flex flex-col gap-4">
                <div className="w-48 h-48 mx-auto rounded-full bg-neutral-100 dark:bg-zinc-800 border-4 border-emerald-500 relative flex items-center justify-center overflow-hidden">
                  <span className="material-symbols-outlined text-6xl text-neutral-400">face</span>
                  <div className="absolute inset-0 border-[8px] border-emerald-500 rounded-full animate-ping opacity-20"></div>
                </div>
                <div className="text-sm font-bold text-neutral-800 dark:text-zinc-200 font-sans">
                  Posisikan Wajah ke Tengah<br/>dan Tersenyum
                </div>
                <button onClick={handleKYC} className="w-full bg-emerald-600 text-white rounded-xl py-3 font-bold uppercase tracking-wider text-xs mt-2">
                  Ambil Foto Validasi
                </button>
              </div>
            )}

            {kycStep === 'processing' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 border-4 border-neutral-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-neutral-600 dark:text-zinc-300 uppercase tracking-wider animate-pulse">Menghubungkan ke Dukcapil...</span>
              </div>
            )}

            <button onClick={() => setShowKYCModal(false)} className="mt-4 text-[10px] text-neutral-400 font-bold uppercase tracking-wider hover:text-neutral-600 dark:hover:text-zinc-200">
              Batalkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
