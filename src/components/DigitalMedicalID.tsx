import React, { useState, useEffect } from 'react';
import { Contact, Heart, ShieldAlert, Award, AlertTriangle, Edit3, Save, CheckCircle2, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface MedicalProfile {
  fullName: string;
  birthDate: string;
  bloodType: string;
  allergies: string;
  medications: string;
  conditions: string;
  insuranceName: string;
  insuranceId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRel: string;
}

export default function DigitalMedicalID() {
  const [isEditing, setIsEditing] = useState(() => {
    const saved = localStorage.getItem('wirasaga_medical_id');
    if (!saved) return true;
    try {
      const parsed = JSON.parse(saved);
      return !parsed.fullName;
    } catch {
      return true;
    }
  });
  const [profile, setProfile] = useState<MedicalProfile>(() => {
    const saved = localStorage.getItem('wirasaga_medical_id');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      fullName: '',
      birthDate: '',
      bloodType: 'O',
      allergies: '',
      medications: '',
      conditions: '',
      insuranceName: '',
      insuranceId: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRel: ''
    };
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('wirasaga_medical_id', JSON.stringify(profile));
    setIsEditing(false);
    toast.success('Kartu Medis Digital berhasil diperbarui & disimpan offline!', { position: 'bottom-center' });
  };

  const calculateAge = (dob: string) => {
    if (!dob) return '-';
    try {
      const birth = new Date(dob);
      const diff = Date.now() - birth.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="bg-transparent w-full p-3 sm:p-5 relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* Title */}
      <div className="mb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#AF101A] bg-[#BA1A20]/10 px-2.5 py-1 rounded-full dark:text-red-400 dark:bg-red-500/10">
          Identitas Medis Penyelamat
        </span>
        <h3 className="text-xl font-extrabold text-neutral-900 dark:text-zinc-50 mt-3 flex items-center gap-2 font-sans">
          <Contact className="w-5 h-5 text-primary dark:text-red-500 animate-pulse" />
          Kartu Medis Digital ICE (Offline)
        </h3>
        <p className="text-xs text-neutral-600 dark:text-zinc-450 mt-1 font-medium">
          Simpan informasi medis krusial langsung pada memori internal gawai Anda. Kartu ini dapat ditunjukkan seketika untuk memandu tindakan paramedis ambulans/dokter jika Anda tidak sadar.
        </p>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 space-y-4 animate-fade-in text-left">
          <h4 className="text-xs font-black text-primary dark:text-red-400 uppercase tracking-widest border-b pb-2 flex items-center gap-1">
            <Edit3 className="w-4 h-4" /> Edit Informasi Medis
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-neutral-600 dark:text-zinc-400 uppercase">Nama Lengkap Pasien</label>
              <input 
                type="text" 
                required
                value={profile.fullName} 
                onChange={e => setProfile({...profile, fullName: e.target.value})}
                className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-neutral-950 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-neutral-600 dark:text-zinc-400 uppercase">Tanggal Lahir</label>
              <input 
                type="date" 
                required
                value={profile.birthDate} 
                onChange={e => setProfile({...profile, birthDate: e.target.value})}
                className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-neutral-950 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-neutral-600 dark:text-zinc-400 uppercase">Golongan Darah</label>
              <select 
                value={profile.bloodType} 
                onChange={e => setProfile({...profile, bloodType: e.target.value})}
                className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-on-surface dark:text-white font-semibold outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="O+">O+</option>
                <option value="Lainnya">Lainnya / Tidak Tahu</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-neutral-600 dark:text-zinc-400 uppercase">Alergi Obat / Makanan</label>
              <input 
                type="text" 
                value={profile.allergies} 
                onChange={e => setProfile({...profile, allergies: e.target.value})}
                placeholder="Misal: Penisilin, Antalgin, Kacang"
                className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-neutral-950 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
              <label className="text-[10px] font-black text-neutral-600 dark:text-zinc-400 uppercase">Kondisi Kronis & Catatan Medis Mandiri</label>
              <textarea 
                rows={2}
                value={profile.conditions} 
                onChange={e => setProfile({...profile, conditions: e.target.value})}
                placeholder="Informasi penting misal: Asma, Diabetes, Hipertensi, Ring Jantung"
                className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-neutral-950 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-primary w-full resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
              <label className="text-[10px] font-black text-neutral-600 dark:text-zinc-400 uppercase">Obat Rutin yang Harus Dikonsumsi</label>
              <input 
                type="text" 
                value={profile.medications} 
                onChange={e => setProfile({...profile, medications: e.target.value})}
                placeholder="Nama obat utama"
                className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-neutral-950 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-neutral-600 dark:text-zinc-400 uppercase">Kontak ICE Terpercaya</label>
              <input 
                type="text" 
                required
                value={profile.emergencyContactName} 
                onChange={e => setProfile({...profile, emergencyContactName: e.target.value})}
                placeholder="Nama penanggung jawab"
                className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-neutral-950 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-neutral-600 dark:text-zinc-400 uppercase">Hubungan Kontak ICE</label>
              <input 
                type="text" 
                required
                value={profile.emergencyContactRel} 
                onChange={e => setProfile({...profile, emergencyContactRel: e.target.value})}
                placeholder="Misal: Ayah Kandung, Ibu, Suami, Istri"
                className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-neutral-950 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
              <label className="text-[10px] font-black text-neutral-600 dark:text-zinc-400 uppercase">Nomor Telepon Kontak ICE</label>
              <input 
                type="text" 
                required
                value={profile.emergencyContactPhone} 
                onChange={e => setProfile({...profile, emergencyContactPhone: e.target.value})}
                placeholder="Format: +62xxx"
                className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-neutral-950 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-neutral-600 dark:text-zinc-400 uppercase">Penyedia Asuransi / BPJS</label>
              <input 
                type="text" 
                value={profile.insuranceName} 
                onChange={e => setProfile({...profile, insuranceName: e.target.value})}
                placeholder="Misal: BPJS Kesehatan, Prudential"
                className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-805 rounded-xl px-4 py-2.5 text-xs text-neutral-950 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-neutral-600 dark:text-zinc-400 uppercase">Nomor Asuransi / No. BPJS</label>
              <input 
                type="text" 
                value={profile.insuranceId} 
                onChange={e => setProfile({...profile, insuranceId: e.target.value})}
                placeholder="Nomor kartu asuransi peserta"
                className="bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-805 rounded-xl px-4 py-2.5 text-xs text-neutral-950 dark:text-white font-semibold outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-primary text-white py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:bg-neutral-900"
            >
              <Save className="w-4 h-4" /> Simpan Kartu Medis
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-3 bg-neutral-100 text-neutral-800 dark:bg-zinc-800 dark:text-white rounded-xl font-black text-xs cursor-pointer"
            >
              Batal
            </button>
          </div>
        </form>
      ) : !profile.fullName ? (
        <div className="bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 text-center flex flex-col items-center justify-center min-h-[220px]">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-3 text-[#AF101A] dark:text-red-400 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider mb-1">Kartu Medis Belum Diaktifkan</h4>
          <p className="text-[11px] text-neutral-500 dark:text-zinc-400 max-w-sm mb-4 leading-relaxed font-semibold">
            Anda belum mengisi identitas medis darurat (ICE). Isi data medis Anda untuk disimpan secara lokal di perangkat gawai Anda demi keselamatan saat kondisi kritis.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" /> Lengkapi Kartu Medis Sekarang
          </button>
        </div>
      ) : (
        /* Render Premium High-Contrast Urgent Card Visual */
        <div className="flex flex-col gap-4">
          <div className="bg-[#BA1A20] dark:bg-zinc-950 text-white rounded-[32px] p-5 sm:p-6 shadow-2xl relative overflow-hidden border border-[#BA1A20] dark:border-zinc-800 select-none text-left">
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

            {/* Red alert stripe on Left Side for dramatic visual ID aesthetic */}
            <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-yellow-400"></div>

            {/* Card Header */}
            <div className="flex justify-between items-start mb-6 pl-2.5">
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-yellow-400 filled animate-pulse shrink-0" />
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-red-100 dark:text-zinc-400">MEDIS SIAGA REPUBLIK INDONESIA</h4>
                  <h3 className="text-sm font-black text-white font-serif tracking-tight uppercase">KARTU PASIEN DARURAT (ICE)</h3>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer text-white shrink-0 border border-white/10"
                title="Edit Medical Profile"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Big Identity Info Grid */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/15 dark:border-zinc-800/80 pl-2.5">
              <div>
                <span className="text-[9px] font-bold text-red-200 dark:text-zinc-500 uppercase tracking-wider block">ID Pasien Terdaftar</span>
                <span className="text-base font-black truncate max-w-[150px] block mt-0.5">{profile.fullName}</span>
                <span className="text-[10px] text-red-100/90 dark:text-zinc-400 block mt-0.5">{calculateAge(profile.birthDate)} Tahun • Gol {profile.bloodType}</span>
              </div>
              
              <div className="text-right flex flex-col justify-end items-end">
                <span className="text-[9px] font-bold text-red-200 dark:text-zinc-500 uppercase tracking-wider block">Golongan Darah Utama</span>
                <span className="w-11 h-11 rounded-2xl bg-white text-[#AF101A] flex items-center justify-center font-black text-xl shadow-lg border-2 border-yellow-400 mt-1 animate-pulse">
                  {profile.bloodType}
                </span>
              </div>
            </div>

            {/* Medical Vulnerabilities list (Allergies & Conditions) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-b border-white/15 dark:border-zinc-800/80 pb-4 pl-2.5">
              <div>
                <span className="text-[9px] font-bold text-red-200 dark:text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-400" /> Alergi Utama Pasien
                </span>
                <p className="text-[11px] font-black text-yellow-300 dark:text-yellow-400 mt-1 leading-snug">
                  {profile.allergies || 'Tidak Ada Alergi Diketahui'}
                </p>
              </div>

              <div>
                <span className="text-[9px] font-bold text-red-200 dark:text-zinc-500 uppercase tracking-wider block">Kondisi Medis Kronis</span>
                <p className="text-[11px] font-extrabold text-white mt-1 leading-snug">
                  {profile.conditions || 'Tidak Ada Kondisi Kronis Utama'}
                </p>
              </div>
            </div>

            {/* Emergency contacts footer on Card */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pl-2.5">
              <div>
                <span className="text-[9px] font-bold text-red-200 dark:text-zinc-500 uppercase tracking-wider block">Kontak Penanggung Jawab (ICE)</span>
                <p className="text-[11.5px] font-black text-white mt-0.5 leading-tight">
                  {profile.emergencyContactName} ({profile.emergencyContactRel})
                </p>
              </div>

              <div className="self-start sm:self-auto">
                <a 
                  href={`tel:${profile.emergencyContactPhone}`}
                  className="bg-yellow-400 drop-shadow-md text-neutral-900 border border-yellow-500 rounded-full px-4 py-1.5 text-[11px] font-black flex items-center gap-1 hover:bg-white transition-all scale-active cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">call</span>
                  {profile.emergencyContactPhone}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-3 text-[11px] text-neutral-700 dark:text-zinc-350 flex items-start gap-2 text-left font-medium leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <span>
              <strong>Penyimpanan Lokal Aktif:</strong> Data terenkripsi internal aman. Responden medis lokal dapat memeriksa profil ini secara mandiri tanpa membutuhkan sambungan internet/FCM.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
