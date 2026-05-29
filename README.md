# Wirasaga - Multi-modal AI Emergency Response Platform

Wirasaga adalah platform siaga darurat, pertolongan pertama, dan pemetaan bencana komprehensif terintegrasi yang dirancang khusus untuk masyarakat Indonesia. Aplikasi ini menggabungkan kecanggihan **Kecerdasan Buatan Multi-modal (AI Triage)**, ketangguhan **Mode Offline Mandiri**, serta kecepatan **koordinasi relawan berbasis komunitas** untuk menyelamatkan jiwa dalam situasi kritis.

---

## 🎨 Visi & Konsep Desain
Wirasaga dibangun dengan prinsip **Aesthetic Actionability**. Antarmuka dikombinasikan antara kegunaan taktis tingkat tinggi dengan palet warna kontras modern (**Cosmic Dark Slate** dan aksen **Emerald Green / Urgent Red**). Tata letak diatur secara presisi untuk kenyamanan mata saat panik, mendukung visual malam, kegunaan satu tangan (*one-handed operation*), perlindungan *touch-action* (*anti-select* secara menyeluruh di level framework saat menahan jemari menekan tombol darurat SOS), dan aksesibilitas *high-touch target*.

---

## 🛠️ Fitur Utama & Keunggulan

### 1. Smart SOS, Auto-Crash Detection & Anti-Prank
*   **Deteksi Guncangan Ekstrem (Crash / Heavy Fall Detection)**: Memanfaatkan sensor akselerometer perangkat (*DeviceMotionEvent*) untuk mendeteksi manakala perangkat mengalami jatuh keras (tabrakan). Algoritma menyaring getaran biasa, namun seketika merespons guncangan ekstrem dengan meluncurkan hitungan mundur 10 detik SOS layar penuh secara otonom (Autopilot Darurat).
*   **Peringatan Hukum (Anti-Prank)**: Mengingat rawannya platform laporan darurat dari pemalsuan telepon iseng, fitur SOS dilindungi lapisan psikologis peringatan pidana hukum ITE yang terintegrasi modul simulasi senyap perekaman multimedia otomatis di latar belakang.
*   **Media Multi-modal & Pencegahan Ketidaksengajaan**: Pengguna memerlukan upaya lebih (*hold 2-detik* tombol utama dan 5 detik countdown opsional batal) agar SOS tak sengaja meluncur.
*   **Gemini AI Dispatcher**: Menggunakan SDK generasi terbaru `@google/genai` sisi server. AI memvalidasi laporan teks guncangan atau suara kepanikan, memberikan skoring metrik situasi kedaruratan (1-10), menglasifikasi potensi klasifikasi medis/keamanan/lingkungan dan memandu relawan via radar.

### 2. Radar Komunitas Darurat & "Buddy System"
*   **Pemetaan Papan Radar 360 (Google Maps)**: Memvisualisasikan posisi tepat seluruh letupan insiden aktif publik ke dalam *viewport* presisi 3D di peta, merinci titik pangkalan Shelter/Titik Kumpul dan Rumah Sakit rujukan terekomendasi.
*   **Buddy System Malam Hari & Relawan Siaga**: Memungkinkan penugasan *Pairing Protocol*. Korban dijemput bola. Memasangkan sistem perisai relawan kepada insan terpapar bahaya. (Simulasi pendampingan medis / sekuriti).

### 3. Panggilan Darurat Nasional & Jaringan Awan Kontak ICE
*   **Sentral Operator Darurat 1-Tap**: Direktori gesit merujuk Pos Polisi (110), Evakuasi Ambulan Gawat (118/119), SAR (115), dan Penanganan Bencana BNPB(112). 
*   **Node Cloud Kontak Pribadi Terpaut (Firebase)**: Kerabat keluarga didata murni ke dalam koleksi aman Cloud (`ice_contacts`) Firestore yang dipayungi akun Login Google kredensial (Auth). HP Anda hilang? Pinjam HP Satpam/Gojek, Login Google, tarik nomor istri sedia kala, instan!

### 4. Kartu Medis Pribadi (Offline First Proxy)
*   **Privasi Akses Instan (Tanpa Kendala 4G)**: Kartu identitas medis vital (Golongan Darah, Parameter Alergi fatal antibiotik/makanan, Riwayat Operasi) secara eksklusif dikarantinakan 100% pada sandbox Memori Lokal *Browser* (`LocalStorage`). Bebas bocor Data Breach server awan skala besar, hadir siap di detik ke-1 paramedis menanyai "Korban ada alergi P3K ga?!" biarpun gawai ada di pegunungan *No Service*.

### 5. Sintesis Audio Sirene Web & SOS Strobo Cahaya
*   **Generator Audio Independen Murni Web**: Generator audio gelombang sirkuit sinus menggaungkan Nada Ambulans, Alert Nuklir, dan Air Raid murni 0MB tanpa perlu menunggu MP3/WAV selesai *download buffering*. Merobek bising jalanan secara nyata, memecahkan sekat hening seketika sirine di-taping *On*.
*   **Modulator Suar Visual (Flash)**: Gelombang SOS strobo menerjamahkan sandi ketukan Internasional Morse `··· --- ···` ke dalam lampu latar / nyala-pijar intens.

### 6. Relai Dini Bencana Patahan Gempa BMKG
*   Terpusat mengekstrak informasi API parameter gempa paling mutakhir (Magnitudo, Kedalaman asimptotis hiposentrum). Terdapat pengingat *Trigger* bilamana gelombang ombak darat punya "Potensi Tsunami" di ambang batas evakuasi masif. 

### 7. Kit Pertolongan Darurat Kehidupan & Metronom Asisten CPR
*   Buku survival pintar memuat manual resusitasi. Dibumbui piranti lunak generator ketukan (*Metronome engine*) berkunci padat di kecepatan taktis 110 ketukan per menit (BPM) untuk meregulasi laju pemompaan Kompresi Dada (RJP) oleh penyelamat awam dengan daya hidup paling mujarab bagi pasien Jantung berhenti berdenyut.

---

## 🗄️ Infrastruktur Pustaka Backend / Hybrid Cloud

Pemetaan entitas dibagi memisahkan batas domain cloud dan persistent offline demi keamanan dan redundansi absolut:

```
┌─────────────────────────────────────────────────────────────┐
│                   WIRASAGA APP (React/Vite)                 │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
     [ BROWSER LOCAL STORAGE ]        [ FIREBASE FIRESTORE ]
 ┌───────────────────────────┐   ┌───────────────────────────┐
 │ - Kartu Medis Sensitif    │   │ - Daftar Kontak Keluarga  │
 │ - Tembolok Log BMKG       │   │   (Terkait Identitas UID) │
 │ - Setelan Preferensi Tema │   │ - Pemetaan Kordinat Radar │
 └───────────────────────────┘   └───────────────────────────┘
```

---

## 🚀 Panduan Membangun Pangkalan (Developer)

### Prasyarat Terminal
*   Engine: Node.js `^18.0` atau terbaru. 
*   Package Resolver: `npm` 

### Aliran Integrasi *Pipeline*

1.  **Pengadaan Repositori & Klon**:
    ```bash
    git clone <repository_url>
    cd wirasaga
    ```

2.  **Karantina Variabel Lingkungan Siber**:
    Buat bingkai env lokal dari stensil:
    ```bash
    cp .env.example .env
    ```
    Populasikan dua permata Kunci Layanan tersemat:
    *   `GEMINI_API_KEY`: Google GenAI (Gemini) Token Pemasok Tenaga Berpikir Asisten. 
    *   `GOOGLE_MAPS_PLATFORM_KEY`: Tali rantai kunci penyedia Layanan *Maps Javascript API*, dan pelacak tempat (Places API) valid.

3.  **Kredensiasi Keamanan Layanan Firebase**:
    Impor sertifikat Kredensial *Client Database Firebase*. Tuangkan ke bilik root repo sebagai fail berkode `firebase-applet-config.json`. Selaraskan Firestore agar daftar SOS Cloud memupuk.

4.  **Materialisasi Modul Node**:
    ```bash
    npm install
    ```

5.  **Menyalakan Mesin Pemandu Pengembangan**:
    ```bash
    npm run dev
    ```
    Injeksi Express *Middlewares* dengan arsitektur perutean simfoni menyatukan komutator React UI pada Port Server Universal `3000` (http://localhost:3000).

6.  **Kompilasi Fabrikasi Skala Produksi (*Baking*)**:
    ```bash
    npm run build
    npm run start
    ```
    Operasional pengompilasian menggunakan arsitektur *esbuild* mendesain ulang skrip typescript tebal (*Server.ts*) menjadi raksasa satu-baris murni ringkas (`server.cjs`). Cold Start menekan hingga hitungan nol mikro detik di gerbang Docker Cloud Kontainer.

---

## 🛡️ Rantai Pasok Penjaga (AI Guardrails Mechanism)
Wirasaga AI Agen (`Siaga-Bot`) diberkahi dengan filter pemburu negatif (*Hard Guardrails*) bertemakan Paramedis Taktis, secara agnostik akan memberangus atau membungkam seruan percakapan yang mendistorsi fungsi medik darurat / lalu lintas seperti; Resep membuat kue, candaan romansa, permintaan kode sumber terlarang, nasihat relasi toksik, serta politik dan ras. Mesin AI memproteksi bahwa asisten senantiasa netral, cepat, serius demi kepentingan penyelamatan kemanusiaan.
