import React from 'react';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export default function TermsPrivacyModal({ isOpen, onClose, type }: TermsPrivacyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 min-h-[100dvh]">
      <div 
        className="bg-surface dark:bg-zinc-900 border border-outline-variant/20 dark:border-zinc-800 rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl animate-fade-in custom-scrollbar overflow-hidden relative"
      >
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20 dark:border-zinc-800 shrink-0 bg-surface dark:bg-zinc-900 z-10 sticky top-0">
          <h2 className="text-title-lg font-bold text-on-surface dark:text-锌-50">
            {type === 'terms' ? 'Ketentuan Layanan' : 'Kebijakan Privasi'}
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high dark:bg-zinc-800 dark:hover:bg-zinc-700 text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar text-body-md text-on-surface-variant dark:text-zinc-300 space-y-6">
          {type === 'terms' && (
            <>
              <div>
                <h3 className="text-title-md font-bold text-on-surface dark:text-zinc-50 mb-2">1. Penerimaan Ketentuan</h3>
                <p>Dengan mengakses atau menggunakan aplikasi Wirasaga ("Layanan"), Anda setuju untuk terikat oleh Ketentuan Layanan ini. Jika Anda tidak setuju dengan ketentuan apa pun, dilarang mengakses Layanan ini.</p>
              </div>
              
              <div>
                <h3 className="text-title-md font-bold text-on-surface dark:text-zinc-50 mb-2">2. Penggunaan Layanan yang Diizinkan</h3>
                <p>Layanan ini secara khusus dirancang untuk tujuan pelaporan keadaan darurat dan meminta bantuan. Dilarang keras menggunakan aplikasi ini untuk laporan palsu (prank), pelecehan, atau tujuan ilegal lainnya. Penyalahgunaan dapat berakibat pada pemblokiran akun dan tindakan hukum.</p>
              </div>

              <div>
                <h3 className="text-title-md font-bold text-on-surface dark:text-zinc-50 mb-2">3. Akurasi Informasi</h3>
                <p>Anda bertanggung jawab penuh untuk memastikan setiap laporan darurat, termasuk detail lokasi, gambar, dan deskripsi kejadian, akurat dan benar pada saat pengiriman. Kami tidak bertanggung jawab atas keterlambatan atau tindakan keliru yang ditimbulkan oleh informasi pelaporan yang tidak akurat.</p>
              </div>

              <div>
                <h3 className="text-title-md font-bold text-on-surface dark:text-zinc-50 mb-2">4. Pembatasan Tanggung Jawab</h3>
                <p>Layanan Wirasaga disediakan "sebagaimana adanya". Meskipun kami berusaha memfasilitasi komunikasi darurat secepat mungkin, kami tidak menjamin kelangsungan, keandalan mutlak, atau waktu penyelesaian tindakan penyelamatan. Penggunaan layanan adalah risiko Anda sendiri.</p>
              </div>

              <div>
                <h3 className="text-title-md font-bold text-on-surface dark:text-zinc-50 mb-2">5. Modifikasi Ketentuan</h3>
                <p>Kami berhak merevisi ketentuan layanan ini sewaktu-waktu tanpa pemberitahuan sebelumnya. Dengan tetap menggunakan Layanan setelah revisi ditambahkan, Anda secara nyata menerima persyaratan yang diperbarui tersebut.</p>
              </div>
            </>
          )}

          {type === 'privacy' && (
            <>
              <div>
                <h3 className="text-title-md font-bold text-on-surface dark:text-zinc-50 mb-2">1. Pengumpulan Data</h3>
                <p>Kami mengumpulkan informasi yang Anda sediakan seperti nama, alamat email, golongan darah, riwayat medis (atas izin Anda), serta kontak darurat (ICE). Saat Anda membuat laporan SOS, kami juga mengumpulkan lokasi GPS, data audio, dan gambar Anda untuk memverifikasi keadaan darurat.</p>
              </div>
              
              <div>
                <h3 className="text-title-md font-bold text-on-surface dark:text-zinc-50 mb-2">2. Penggunaan Data</h3>
                <p>Data lokasi dan medis Anda secara khusus hanya dan akan digunakan untuk operasi mitigasi dan tanggap darurat, membantu paramedis atau tim kepolisian di sekitar Anda (Buddy System), serta memungkinkan kontak darurat Anda mengetahui status keamanan real-time Anda.</p>
              </div>

              <div>
                <h3 className="text-title-md font-bold text-on-surface dark:text-zinc-50 mb-2">3. Pembagian Data dengan Pihak Ketiga</h3>
                <p>Informasi pelaporan SOS Anda, termasuk lokasi dan identitas, mungkin dibagikan kepada otoritas publik dan relawan mitra responsif saat darurat terjadi. Kami tidak akan pernah menjual atau menyewakan informasi pribadi Anda kepada pengiklan atau pihak tidak terkait lainnya.</p>
              </div>

              <div>
                <h3 className="text-title-md font-bold text-on-surface dark:text-zinc-50 mb-2">4. Keamanan Data</h3>
                <p>Informasi pribadi Anda disimpan di lingkungan yang aman menggunakan infrastruktur database berstandar tinggi. Meskipun demikian, ingat bahwa tidak ada metode transmisi internet yang 100% aman.</p>
              </div>

              <div>
                <h3 className="text-title-md font-bold text-on-surface dark:text-zinc-50 mb-2">5. Hak Akses dan Penghapusan</h3>
                <p>Anda memegang kendali atas profil dan data kontak ICE Anda. Anda berhak memperbarui rincian tersebut, maupun meminta agar akun Anda serta data medis Anda secara utuh dihapus dari sistem kami sewaktu-waktu.</p>
              </div>
            </>
          )}
        </div>
        
        <div className="p-5 border-t border-outline-variant/20 dark:border-zinc-800 shrink-0 bg-surface dark:bg-zinc-900 sticky bottom-0">
          <button 
            onClick={onClose}
            className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
