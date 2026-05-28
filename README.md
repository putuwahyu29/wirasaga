# Wirasaga - Multi-modal AI Emergency Response Radar

Wirasaga adalah platform siaga darurat, pertolongan pertama, dan pemetaan bencana komprehensif terintegrasi yang dirancang khusus untuk masyarakat Indonesia. Aplikasi ini menggabungkan kecanggihan **Kecerdasan Buatan Multi-modal (AI Triage)**, ketangguhan **Mode Offline Mandiri**, serta kecepatan **koordinasi relawan berbasis komunitas** untuk menyelamatkan jiwa dalam situasi kritis.

---

## 🎨 Visi & Konsep Desain
Wirasaga dibangun dengan prinsip **Aesthetic Actionability**. Antarmuka dikombinasikan antara kegunaan taktis tingkat tinggi dengan palet warna kontras modern (**Cosmic Dark Slate** dan aksen **Emerald Green / Urgent Red**). Tata letak diatur secara presisi untuk kenyamanan mata saat panik, mendukung visual malam, kegunaan satu tangan (*one-handed operation*), dan aksesibilitas cepat (*high touch target*).

---

## 🛠️ Fitur Utama & Keunggulan

### 1. Smart SOS & Autonomous AI Triage
*   **Media Multi-modal**: Pengguna dapat mengirimkan sinyal bahaya (SOS) dengan lampiran gambar situasi atau rekaman audio.
*   **Gemini 3.5 Flash Dispatcher**: Menggunakan SDK generasi terbaru `@google/genai` yang berjalan aman di sisi server (`server.ts`). AI secara mandiri memvalidasi laporan (mengeliminasi prank), mendeteksi kategori (MEDIS, MEKANIK, KEAMANAN, LINGKUNGAN), menaksir tingkat keparahan (skala 1-10), merekomendasikan alat darurat yang harus dibawa oleh penolong, dan mereferensikan radius evakuasi.
*   **Bypass Offline Pintar**: Ketika kunci API atau koneksi internet terganggu, server secara cerdas mengaktifkan algoritma simulasi lokal (*heuristic matching engine*) agar sistem triage tetap menghasilkan keluaran logis bagi penyelamat di lokasi.

### 2. Kartu Medis Digital ICE (In Case of Emergency) - *Offline-First*
*   **Prinsip Desain Tanpa Dummy**: Dibuat bersih tanpa pengotor data palsu/dummy. Jika pengguna baru mengaktifkan platform, sistem akan langsung menyajikan layar inisialisasi yang intuitif untuk mengisikan profil darurat yang sebenarnya.
*   **Offline-First & Privacy-Focused**: Rekam medis darurat (Golongan Darah, Alergi Obat/Makanan, Riwayat Penyakit Kronis, Kontak Keluarga) disimpan secara eksklusif dalam **Local Storage** gawai. Data sensitif ini tidak dikirim ke server pusat untuk memastikan data selalu dapat diakses seketika sekalipun jaringan seluler mati total (*blank spot*), sekaligus memproteksi hak privasi medis pengguna.

### 3. Sirene Darurat & Morse Signal Generator
*   **Audio Sirene Taktis**: Menyediakan 4 tipe alarm darurat (Ambulans, Alarm Nuklir, Air Raid, dan Sirene Polisi).
*   **Web Audio API (No-Dependency)**: Dibangun tanpa menggunakan file `.mp3` atau `.wav` fisik. Suara disintesis langsung menggunakan sirkuit osilator terintegrasi pada browser. Hal ini memastikan sirene dapat berbunyi seketika tanpa perlu proses pengunduhan audio yang rawan gagal saat internet buruk.
*   **Flash Sinyal Morse**: Memanfaatkan ritme kedipan layar berlatar belakang kontras tinggi berpola kode Morse internasional `··· --- ···` (S-O-S) untuk menarik pertolongan visual di kondisi gelap gulita atau reruntuhan bencana.

### 4. Radar BMKG & Deteksi Gempa Terkini
*   Sinkronisasi dinamis dengan data gempa terbaru BMKG. Menampilkan informasi magnitudo, kedalaman, koordinat pusat gempa, serta tingkat potensi tsunami secara real-time demi memudahkan mitigasi mandiri.

### 5. Koleksi Panduan P3K & CPR Companion
*   Panduan digital penanganan luka, cedera, patah tulang, gigitan hewan berbisa, dan serangan jantung. Dilengkapi **metronom audio CPR (RJP)** berketukan stabil (100–120 bpm) untuk membantu ritme kompresi dada yang presisi saat menolong korban henti jantung.

---

## 🗄️ Arsitektur Integrasi & Sinkronisasi Data

Wirasaga membagi pengelolaan data dalam dua piringan arsitektur yang dirancang secara saksama:

```
┌─────────────────────────────────────────────────────────────┐
│                      WIRASAGA APP (UI)                      │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
     [ OFFLINE STORAGE ]             [ FIREBASE FIRESTORE ]
 ┌───────────────────────────┐   ┌───────────────────────────┐
 │ - Kartu Medis Digital ICE │   │ - Kontak Keluarga Darurat │
 │ - Pengaturan Preferensi   │   │ - Laporan Insiden Aktif   │
 │ - Log Cache BMKG          │   │ - Koordinat Lokasi Relawan│
 └───────────────────────────┘   └───────────────────────────┘
```

1.  **Firestore (Cloud Storage)**:
    *   **Kontak ICE Keluarga**: Disimpan di Firestore (koleksi `ice_contacts`) yang diikat aman dengan Firebase Auth UUID pengguna. Memungkinkan pemulihan otomatis saat pengguna berganti gawai.
    *   **Basis Laporan Radar Kejadian**: Data kontribusi publik (*user generated reports*) disimpan dalam koleksi insiden (`incidents`) di mana koordinat lintang-bujur dipetakan secara real-time ke peta siaga relawan yang mencakup radar pertolongan terdekat.
2.  **Browser LocalStorage (Local Storage)**:
    *   Dipilih khusus untuk data personal seperti profil medis **Digital Medical ID**. Ini memastikan data dapat diakses instan sewaktu gawai dalam status *airplane mode*, kehabisan kuota, atau di tengah bencana gempa di mana jalur operator seluler mati.

---

## 🚀 Panduan Pengembangan Lokal

### Prasyarat
*   Node.js (versi 18 atau lebih baru)
*   NPM

### Langkah Instalasi

1.  **Kloning Repositori**:
    ```bash
    git clone <repository_url>
    cd wirasaga
    ```

2.  **Konfigurasi Environment**:
    Salin file `.env.example` ke `.env` dan isikan kredensial yang relevan:
    ```bash
    cp .env.example .env
    ```
    Isi variabel berikut:
    *   `GEMINI_API_KEY`: Kunci API Google Gemini untuk analisis triage dan chatbot medis.
    *   `GOOGLE_MAPS_PLATFORM_KEY`: Kunci API Google Maps untuk pemetaan radar kejadian.

3.  **Persiapkan Kredensial Firebase**:
    Letakkan kredensial web app Firebase Anda dalam file `firebase-applet-config.json` pada direktori root proyek.

4.  **Instalasi Dependensi**:
    ```bash
    npm install
    ```

5.  **Jalankan Server Pengembangan**:
    ```bash
    npm run dev
    ```
    Aplikasi akan berjalan pada port default `3000` (http://localhost:3000) yang mengintegrasikan React SPA (Vite) dengan server Express (server.ts) secara harmonis.

6.  **Kompilasi Produksi (Build)**:
    ```bash
    npm run build
    npm run start
    ```
    Perintah build akan membundel React aplikasi ke folder `dist` dan mengompilasi server TypeScript ke `dist/server.cjs` menggunakan `esbuild` demi kinerja cold-start terbaik dan kompatibilitas Node.js penuh.

---

## 🛡️ Kebijakan Batasan (Guardrails AI)
Chatbot Asisten AI dibekali sistem instruksi yang ketat untuk menolak permintaan di luar ranah penyelamatan, medis, keamanan, krisis, dan kegagalan mekanik jalan raya, guna menjamin fokus fungsionalitas platform sebagai alat penyelamat khalayak umum.
