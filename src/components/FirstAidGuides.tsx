import React, { useState, useEffect } from 'react';
import { ShieldCheck, Timer, FileText, ChevronRight, Activity, ArrowRight, CornerDownRight, HeartPulse } from 'lucide-react';
import { toast } from 'sonner';

interface GuideFlowStep {
  text: string;
  notes?: string;
  urgent?: boolean;
}

interface DisasterGuide {
  id: string;
  title: string;
  category: 'disaster' | 'medical';
  icon: string;
  desc: string;
  steps: GuideFlowStep[];
  timerLabel?: string;
  recommendation: string;
}

export default function FirstAidGuides() {
  const [activeGuideId, setActiveGuideId] = useState<'gempa' | 'banjir' | 'kebakaran' | 'pendarahan'>('gempa');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  
  // Action Timer for critical responses
  const [timerActive, setTimerActive] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const handleToggleTimer = () => {
    if (!timerActive) {
      setTimerActive(true);
      toast.success('Pemberitahu durasi tindakan diaktifkan! Pantau waktu penanganan Anda.', { position: 'bottom-center' });
    } else {
      setTimerActive(false);
    }
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setSeconds(0);
  };

  const formatSeconds = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const dbGuides: DisasterGuide[] = [
    {
      id: 'gempa',
      title: 'Protokol Gempa Bumi',
      category: 'disaster',
      icon: 'clarify',
      desc: 'Panduan bertahan hidup saat guncangan gempa bumi berlangsung mendadak.',
      timerLabel: 'Durasi Guncangan & Evakuasi Mandiri',
      recommendation: 'Gunakan Tas Siaga Bencana (TSB) dan pastikan jalur evakuasi terbuka.',
      steps: [
        { text: 'Drop, Cover, Hold On!', notes: 'Merunduk segera, lindungi kepala di bawah meja kokoh, dan berpegangan erat.', urgent: true },
        { text: 'Jauhi Kaca dan Dinding Luar', notes: 'Hindari jendela, cermin, dan benda menggantung yang mudah roboh atau pecah.' },
        { text: 'Matikan Kompor & Gas Segera', notes: 'Jika sedang memasak, matikan sumber api jika guncangan masih memungkinkan pergerakan aman.' },
        { text: 'Jangan Gunakan Lift', notes: 'Gunakan tangga darurat manual. Jika terjebak di lift, tekan semua tombol lantai.' },
        { text: 'Evakuasi ke Lapangan Terbuka', notes: 'Begitu guncangan mereda, evakuasi dengan menutup kepala memakai tas atau helm.' }
      ]
    },
    {
      id: 'banjir',
      title: 'Mitigasi Banjir Bandang',
      category: 'disaster',
      icon: 'water_damage',
      desc: 'Respons darurat evakuasi genangan air cepat / luapan sungai.',
      timerLabel: 'Kesiapan Waktu Evakuasi Air Naik',
      recommendation: 'Jauhi dasar aliran banjir atau gorong-gorong sedalam apa pun.',
      steps: [
        { text: 'Amankan Kelistrikan Rumah', notes: 'Segera matikan sekring utama (MCB) rumah guna menghindari sengatan listrik fatal.', urgent: true },
        { text: 'Pindahkan Barang ke Area Tinggi', notes: 'Naikkan berkas dokumen berharga dan elektronik ke lantai dua atau loteng.' },
        { text: 'Tutup Saluran Sanitasi Utama', notes: 'Sumbat pipa pembuangan toilet agar air luapan pembuangan limbah tidak membalik masuk.' },
        { text: 'Evakuasi Sebelum Arus Deras', notes: 'Jika tinggi air mencapai lutut, segera kunci rumah dan mengungsi ke posko dataran tinggi.' },
        { text: 'Hindari Berjalan di Arus Air', notes: 'Arus setinggi 15cm sanggup merobohkan keseimbangan manusia dewasa.' }
      ]
    },
    {
      id: 'kebakaran',
      title: 'Pemadaman & Evakuasi Api',
      category: 'disaster',
      icon: 'fire_truck',
      desc: 'Panduan meloloskan diri dari asap beracun dan jilatan api dalam gedung.',
      timerLabel: 'Waktu Batas Oksigen Kamar Asap',
      recommendation: 'Siapkan masker basah demi menyaring partikel karbon hitam di paru-paru.',
      steps: [
        { text: 'Gunakan APAR Terdekat (PASS)', notes: 'Pull pin, Aim base of fire, Squeeze lever, Sweep side-to-side.', urgent: true },
        { text: 'Merangkak di Bawah Selimut Asap', notes: 'Udara bersih berada dekat dengan lantai pelapis ubin (kurang dari 30cm).', urgent: true },
        { text: 'Gunakan Kain/Masker Basah', notes: 'Tutup hidung dan mulut dengan kain lembap untuk mengurangi inhalasi asap beracun.' },
        { text: 'Raba Pintu Sebelum Membuka', notes: 'Gunakan punggung telapak tangan. Jika pintu terasa panas, jangan dibuka karena api berada di baliknya.' },
        { text: 'Jika Baju Terbakar: Stop, Drop, Roll!', notes: 'Jangan berlari! Rebah ke tanah dan gulingkan badan hingga api benar-benar padam.' }
      ]
    },
    {
      id: 'pendarahan',
      title: 'Penanganan Luka & Pendarahan',
      category: 'medical',
      icon: 'bloodtype',
      desc: 'P3K menghentikan pendarahan berat di arteri / vena akibat robekan tajam.',
      timerLabel: 'Waktu Batas Golden Hour Pasien',
      recommendation: 'Selalu kenakan sarung tangan latex/bersih bila menyentuh cairan luar luka korban.',
      steps: [
        { text: 'Tekan Luka Langsung (Direct Pressure)', notes: 'Tutup luka dengan kain kasa steril lalu tekan kuat-kuat dengan kedua telapak tangan secara solid.', urgent: true },
        { text: 'Tinggikan Anggota Tubuh Terluka', notes: 'Posisikan organ tergores/robek di atas level ketinggian jantung tubuh korban.' },
        { text: 'Balut Tekan yang Rapat', notes: 'Gunakan perban elastis melingkar. Amati sirkulasi ekstrim jari agar tidak membiru.' },
        { text: 'Pasang Torniket Jika Masih Mengalir', notes: 'Lilitkan torniket 5cm di atas luka (di bagian lengan/paha atas) jika pendarahan belum kunjung mampet.', urgent: true },
        { text: 'Hangatkan Tubuh Korban (Cegah Syok)', notes: 'Baringkan korban rata, selimuti badan, dan naikkan kaki 30cm untuk menjaga aliran darah orak.' }
      ]
    }
  ];

  const activeGuide = dbGuides.find(g => g.id === activeGuideId) || dbGuides[0];

  const handleToggleChecklist = (stepIndex: number) => {
    const key = `${activeGuideId}-${stepIndex}`;
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-transparent w-full p-3 sm:p-5 relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* Title */}
      <div className="mb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#AF101A] bg-[#BA1A20]/10 px-2.5 py-1 rounded-full dark:text-red-400 dark:bg-red-500/10">
          Ensiklopedi Penyelamatan P3K
        </span>
        <h3 className="text-xl font-extrabold text-neutral-900 dark:text-zinc-50 mt-3 flex items-center gap-2 font-sans">
          <Activity className="w-5 h-5 text-primary dark:text-red-500 animate-pulse" />
          Protokol Tanggap Darurat Bencana
        </h3>
        <p className="text-xs text-neutral-600 dark:text-zinc-450 mt-1 font-medium">
          Panduan operasional taktis mitigasi mandiri nasional terlokalisasi dalam format alur checklist respons instan.
        </p>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-4 bg-neutral-100 dark:bg-zinc-950 p-1.5 rounded-2xl">
        {dbGuides.map((guide) => (
          <button
            key={guide.id}
            onClick={() => {
              setActiveGuideId(guide.id as any);
              handleResetTimer();
            }}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
              activeGuideId === guide.id
                ? 'bg-white dark:bg-zinc-900 shadow-sm border border-neutral-200 dark:border-zinc-800'
                : 'text-neutral-500 dark:text-zinc-400 hover:text-neutral-950 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg sm:text-xl font-bold mb-1">
              {guide.icon}
            </span>
            <span className="text-[9px] sm:text-[10px] font-extrabold font-serif text-center uppercase tracking-normal truncate w-full">
              {guide.id === 'pendarahan' ? 'P3K Luka' : guide.id}
            </span>
          </button>
        ))}
      </div>

      {/* Dynamic Flowchart Display */}
      <div className="bg-white dark:bg-zinc-900/60 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-4 space-y-4">
        
        {/* Desc header & dynamic timer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-neutral-100 dark:border-zinc-800 pb-3">
          <div>
            <h4 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-1.5 uppercase font-sans">
              <ShieldCheck className="w-4 h-4 text-primary dark:text-red-450" />
              {activeGuide.title}
            </h4>
            <p className="text-[10px] text-neutral-600 dark:text-zinc-400 mt-0.5 font-bold">
              {activeGuide.desc}
            </p>
          </div>

          {/* Action timer */}
          <div className="flex items-center gap-2 bg-neutral-50 dark:bg-zinc-950 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-zinc-800 self-start sm:self-auto shrink-0 transition-all">
            <Timer className={`w-4 h-4 ${timerActive ? 'text-primary animate-spin' : 'text-neutral-400'}`} />
            <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-wider font-extrabold text-neutral-500 dark:text-zinc-400">
                {activeGuide.timerLabel || 'Timer Penyelamatan'}
              </span>
              <span className="text-xs font-black font-mono mt-0.5 text-neutral-950 dark:text-white">
                {formatSeconds(seconds)}
              </span>
            </div>
            <div className="flex gap-1 ml-1.5">
              <button
                onClick={handleToggleTimer}
                className={`px-1.5 py-0.5 text-[8px] font-extrabold uppercase rounded cursor-pointer ${
                  timerActive ? 'bg-neutral-800 text-white dark:bg-white dark:text-black' : 'bg-primary text-white hover:bg-red-700'
                }`}
              >
                {timerActive ? 'Jeda' : 'Mulai'}
              </button>
              <button
                onClick={handleResetTimer}
                className="px-1.5 py-0.5 text-[8px] font-extrabold uppercase rounded bg-neutral-200 text-neutral-800 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {activeGuide.steps.map((step, idx) => {
            const isChecked = !!checklist[`${activeGuideId}-${idx}`];
            return (
              <div
                key={idx}
                onClick={() => handleToggleChecklist(idx)}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-green-500/5 border-green-500/30'
                    : step.urgent
                    ? 'bg-red-500/5 dark:bg-red-500/10 border-primary/40 dark:border-red-500/30'
                    : 'bg-neutral-50 dark:bg-zinc-900 border-neutral-100 dark:border-zinc-800'
                } flex gap-3 text-left`}
              >
                <div className="flex flex-col items-center mt-0.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isChecked ? 'bg-green-500 text-white' : step.urgent ? 'bg-primary text-white animate-pulse' : 'bg-neutral-200 text-neutral-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {idx + 1}
                  </span>
                  {idx < activeGuide.steps.length - 1 && (
                    <div className="w-0.5 bg-neutral-200 dark:bg-zinc-800 h-9 mt-1 bg-dashed flex-grow"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h5 className={`text-xs md:text-sm font-black leading-snug flex items-center gap-1.5 ${
                    isChecked ? 'line-through text-neutral-400 dark:text-zinc-500' : 'text-neutral-900 dark:text-zinc-100'
                  }`}>
                    {step.text}
                    {step.urgent && !isChecked && (
                      <span className="text-[7px] font-extrabold bg-primary/10 text-primary dark:text-red-400 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
                        Penting!
                      </span>
                    )}
                  </h5>
                  {step.notes && (
                    <p className={`text-[10px] md:text-xs leading-normal mt-1 font-medium ${
                      isChecked ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-600 dark:text-zinc-400'
                    }`}>
                      {step.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Recommendation */}
        <div className="bg-neutral-50 dark:bg-zinc-950 p-3 rounded-xl border border-neutral-100 dark:border-zinc-800 text-[10.5px] font-bold text-neutral-700 dark:text-zinc-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-green-500 shrink-0" />
            <span>{activeGuide.recommendation}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0 hidden sm:inline" />
        </div>
      </div>
    </div>
  );
}
