import React, { useState, useEffect } from 'react';
import { Search, Heart, Shield, Sparkles, Flame, Snowflake, AlertOctagon, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

interface GuideItem {
  id: string;
  title: string;
  category: string;
  icon: string;
  summary: string;
  danger: string; // What NEVER to do
  steps: string[];
}

export default function PanduanP3K() {
  const [search, setSearch] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null);
  
  // Timer for Burn Rinse (Luka Bakar)
  const [rinseSecondsLeft, setRinseSecondsLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  // Play a brief high-pitched alarm when the wash timer ends
  const playTimerAlarm = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // high A
      osc.frequency.setValueAtTime(440, audioCtx.currentTime + 0.5);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 1.0);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.5);
    } catch (e) {}
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && rinseSecondsLeft !== null && rinseSecondsLeft > 0) {
      interval = setInterval(() => {
        setRinseSecondsLeft(prev => {
          if (prev !== null && prev <= 1) {
            setTimerActive(false);
            playTimerAlarm();
            toast.success('Bilas Luka Selesai! Bilasan 20 menit terpenuhi. Balut luka steril sekarang.', { position: 'top-center', duration: 8000 });
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, rinseSecondsLeft]);

  const guides: GuideItem[] = [
    {
      id: 'luka-bakar',
      title: 'Luka Bakar (Burns)',
      category: 'TERMAL',
      icon: 'local_fire_department',
      summary: 'Penanganan luka akibat kontak suhu tinggi (api, air mendidih, uap, knalpot motor).',
      danger: 'JANGAN oleskan pasta gigi (odol), minyak goreng, mentega, atau es batu ke luka bakar! Hal ini menutup pori-pori dan memperparah kerusakan jaringan.',
      steps: [
        'Dinginkan luka segera di bawah AIR MENGALIR bersuhu ruangan (bukan air es) selama minimal 20 menit terus-menerus.',
        'Lepaskan perhiasan atau pakaian di sekitar luka bakar secara hati-hati sebelum kulit membengkak.',
        'Jangan memecahkan gelembung kulit (blister) yang terbentuk karena berfungsi melindungi dari infeksi luar.',
        'Balut longgar daerah luka bakar menggunakan plastik bersih kedap udara (plastic wrap) atau kain kasa steril.',
        'Amankan asupan cairan tubuh dengan memberi minum korban air putih hangat.'
      ]
    },
    {
      id: 'jantung',
      title: 'Serangan Jantung (Heart Attack)',
      category: 'KARDIO',
      icon: 'favorite',
      summary: 'Penyumbatan suplai darah otot jantung mendadak, ditandai nyeri dada dan sesak napas.',
      danger: 'JANGAN biarkan pasien berjalan, menyetir, beraktivitas fisik, atau terlalu banyak bergerak karena meningkatkan beban kerja otot jantung yang kekurangan oksigen.',
      steps: [
        'Segera hubungi ambulans (119 / 112) untuk evakuasi darurat taktis.',
        'Tempatkan pasien dalam posisi setengah duduk bersandar, lutut sedikit ditekuk (posisi aman menghemat asupan kardio).',
        'Longgarkan semua pakaian ketat: kancing kerah baju, ikat pinggang, dasi, atau jaket pasien.',
        'Berikan aspirin jika pasien tidak alergi dan sadar penuh (gigit / kunyah perlahan).',
        'Pantau kesadaran dan detak jantung. Bersiaplah melakukan resusitasi Jantung (CPR) via Asisten Metronom kami jika pasien jatuh pingsan.'
      ]
    },
    {
      id: 'tersedak',
      title: 'Asfiksia / Tersedak (Choking)',
      category: 'SALURAN NAPAS',
      icon: 'air',
      summary: 'Penyumbatan saluran napas atas oleh benda asing (biji makanan, mainan, gumpalan padat).',
      danger: 'JANGAN lakukan tepukan punggung jika korban sedang batuk keras secara aktif karena justru menggeser benda asing makin turun menyumbat tenggorokan.',
      steps: [
        'Tanyakan: "Apakah Anda tersedak?". Jika sadar dan bisa batuk, minta korban batuk sekeras mungkin.',
        'Jika tersedak total (korban tidak bisa bicara, memegang lehernya, membiru), posisikan di belakang korban.',
        'Lakukan Manuver Heimlich: Lingkarkan kedua lengan Anda di pinggang korban.',
        'Kepalkan satu tangan di atas pusar korban bawah tulang dada, genggam kepalan itu dengan tangan lainnya.',
        'Hentakkan tangan ke dalam dan ke arah atas secara kuat, cepat, dan berulang hingga benda asing terlontar keluar.',
        'Untuk bayi bawah 1 tahun: Gunakan kombinasi 5 tepukan punggung bawah (back blows) dan 5 hentakan dada (chest thrusts).'
      ]
    },
    {
      id: 'patah-tulang',
      title: 'Patah Tulang / Fraktur',
      category: 'MUSKULO',
      icon: 'bone',
      summary: 'Kerusakan atau patah kontinuitas struktur tulang disebabkan oleh trauma benturan keras.',
      danger: 'JANGAN pernah mencoba meluruskan atau memijat (mengurut) bagian tulang yang bengkok/patah! Hal ini dapat menyobek pembuluh darah utama dan saraf sekitar.',
      steps: [
        'Cegah gerakan pada tulang yang rusak (Imobilisasi). Mintalah korban berdiam di tempat.',
        'Lakukan Pembidaian (Splinting): Gunakan bilah kayu tajam berlapis kain, koran tebal lipat, payung, atau bambu di kanan-kiri lipat tulang patah.',
        'Ikat bidai menggunakan selendang atau tali dengan kencang namun jangan menyumbat sirkulasi darah (cek kehangatan ujung jari).',
        'Bila ada luka terbuka & berdarah: Tutup luka dengan kain steril dan beri tekanan sedang sebelum bidai dipasang.',
        'Apabila tulang menonjol menembus kulit, jangan coba mendorong tulang itu kembali masuk.'
      ]
    },
    {
      id: 'gigitan-ular',
      title: 'Gigitan Ular Berbisa (Snake Bite)',
      category: 'RACUN',
      icon: 'bug_report',
      summary: 'Transfer racun hewan (bisa ular/serangga) ke dalam otot tubuh.',
      danger: 'JANGAN mengikat terlalu kencang (tourniquet), JANGAN menyayat luka gigitan, dan JANGAN menyedot (mengisap) racun dengan mulut! Cara-cara tradisional ini justru mempercepat penyebaran bisa ular atau menyebabkan infeksi berat.',
      steps: [
        'Imobilisasi total lengan atau kaki yang digigit ular. Buat korban menghentikan gerakan tubuh sama sekali agar sirkulasi limfatik bisa melambat.',
        'Biarkan bagian tubuh yang tergigit diposisikan searah atau lebih rendah dari ketinggian letak jantung.',
        'Pasang bidai longgar untuk menjaga sendi-sendi di atas dan di bawah daerah gigitan agar tidak ditekuk.',
        'Lepaskan cincin, gelang, atau jam tangan sebelum pembengkakan meluas.',
        'Segera bawa korban ke Rumah Sakit terdekat untuk disuntik Serum Anti-Bisa Ular (SABU).'
      ]
    }
  ];

  const filteredGuides = guides.filter(g => 
    g.title.toLowerCase().includes(search.toLowerCase()) || 
    g.summary.toLowerCase().includes(search.toLowerCase())
  );

  const formatMinSec = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-transparent w-full relative overflow-hidden p-3 sm:p-5">
      {/* Title */}
      <div className="mb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#AF101A] bg-[#BA1A20]/10 px-2.5 py-1 rounded-full dark:text-red-400 dark:bg-red-500/10">
          Panduan Medis Darurat P3K
        </span>
        <h3 className="text-xl font-extrabold text-neutral-900 dark:text-zinc-50 mt-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-red-500">medical_services</span>
          Katalog Pertolongan Pertama (P3K)
        </h3>
        <p className="text-xs text-neutral-600 dark:text-zinc-450 mt-1 font-medium">
          Panduan cepat, aman, dan tervalidasi sains untuk skenario pembimbingan pertolongan keselamatan jiwa.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative w-full mb-4">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400">
          <Search className="w-5 h-5" />
        </span>
        <input 
          type="text" 
          placeholder="Cari cedera (contoh: Luka Bakar, Jantung...)" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-neutral-100 dark:bg-zinc-800 text-neutral-900 dark:text-white border-none rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-left font-medium capitalize"
        />
      </div>

      {/* Interactive Guide Item List */}
      <div className="flex flex-col gap-2.5">
        {filteredGuides.map((guide) => (
          <div key={guide.id} className="border border-neutral-100 dark:border-zinc-805 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
            <button 
              onClick={() => setSelectedGuide(selectedGuide?.id === guide.id ? null : guide)}
              className="w-full h-full flex items-center justify-between p-4 bg-neutral-50/50 dark:bg-zinc-900/40 text-left hover:bg-neutral-100/50 dark:hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 bg-primary/10 text-primary dark:text-red-400 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined font-sans !text-[22px]">{guide.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-primary dark:text-red-400 uppercase tracking-widest">{guide.category}</p>
                  <p className="text-sm font-black text-neutral-800 dark:text-neutral-50 mt-0.5">{guide.title}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-neutral-400 shrink-0 transform transition-transform duration-200" style={{ transform: selectedGuide?.id === guide.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </button>

            {/* Expanded details */}
            {selectedGuide?.id === guide.id && (
              <div className="p-5 border-t border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-left">
                <p className="text-xs text-neutral-700 dark:text-zinc-300 font-bold mb-4 bg-neutral-50 dark:bg-zinc-900/80 p-3 rounded-xl leading-relaxed border dark:border-zinc-800">
                  {guide.summary}
                </p>

                {/* Specific Burn Countdown Timer if Luka Bakar */}
                {guide.id === 'luka-bakar' && (
                  <div className="my-5 bg-[#AF101A]/5 dark:bg-red-500/5 border border-primary/20 rounded-2xl p-4 text-center">
                    <p className="text-xs font-black text-[#AF101A] dark:text-red-400 uppercase mb-1.5 flex items-center justify-center gap-1.5">
                      <Flame className="w-4 h-4" /> TIMER MONITOR BILAS AIR (20 MENIT MEDCALE)
                    </p>
                    <p className="text-[10px] text-neutral-400 dark:text-zinc-400 mb-3.5 leading-relaxed font-semibold">
                      Pastikan mengalirkan air jernih selama 20 menit penuh di area luka untuk menurunkan suhu kulit secara mendalam.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-2xl font-black font-mono text-neutral-900 dark:text-white bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700/60 px-4 py-2 rounded-xl">
                        {rinseSecondsLeft !== null ? formatMinSec(rinseSecondsLeft) : '20:00'}
                      </div>
                      <div className="flex gap-2">
                        {rinseSecondsLeft === null || rinseSecondsLeft === 0 ? (
                          <button 
                            onClick={() => {
                              setRinseSecondsLeft(1200); // 20 minutes in seconds
                              setTimerActive(true);
                              toast.info('Timer Bilas 20 Menit dimulai. Jaga aliran air stabil.');
                            }}
                            className="bg-primary text-white text-xs px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-1 hover:bg-primary/95 transition-colors cursor-pointer"
                          >
                            Mulai Timer
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => {
                                setTimerActive(!timerActive);
                              }}
                              className="bg-neutral-200 dark:bg-zinc-800 text-neutral-800 dark:text-white text-xs px-3.5 py-2.5 rounded-xl font-bold hover:bg-neutral-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                            >
                              {timerActive ? 'Jeda' : 'Luncur'}
                            </button>
                            <button 
                              onClick={() => {
                                setRinseSecondsLeft(null);
                                setTimerActive(false);
                              }}
                              className="border border-neutral-300 dark:border-zinc-700 text-neutral-600 dark:text-zinc-450 text-xs px-3.5 py-2.5 rounded-xl font-bold hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              Reset
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* DO NOT / JANGAN Card */}
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-4 mb-4 flex gap-3">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400 shrink-0 select-none">cancel</span>
                  <div>
                    <span className="text-xs font-black text-red-800 dark:text-red-300 uppercase tracking-widest font-sans">LARANGAN KERAS (⚠️ JANGAN LAKUKAN!)</span>
                    <p className="text-xs font-bold text-red-700 dark:text-red-300 mt-1 lines-relaxed leading-relaxed">{guide.danger}</p>
                  </div>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="space-y-3 mt-4">
                  <span className="text-xs font-black text-neutral-800 dark:text-neutral-50 uppercase tracking-wider block mb-1">PROSEDUR LANGKAH PENYELAMATAN:</span>
                  {guide.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-[#AF101A] dark:bg-red-500/10 dark:text-red-400 text-xs font-extrabold flex items-center justify-center shrink-0 border dark:border-red-900/30">
                        {idx + 1}
                      </div>
                      <p className="text-xs font-semibold text-neutral-800 dark:text-zinc-300 leading-relaxed mt-0.5">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
