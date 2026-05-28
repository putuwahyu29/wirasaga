import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dns from "dns";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc, updateDoc } from "firebase/firestore";

// Make sure DNS resolves localhost correctly in Node.js environments
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Body parser with 50mb limit to handle high-res photos and base64 audio
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// In-memory list which acts as local cache synced with firestore
interface Incident {
  id: string;
  lat: number;
  lng: number;
  valid: boolean;
  kategori: "MEDIS" | "MEKANIK" | "KEAMANAN" | "LINGKUNGAN";
  tingkat_darurat: number; // 1-10
  ringkasan_masalah: string;
  lokasi_deskripsi: string;
  rekomendasi_alat: string[];
  radius_notifikasi_meter: number;
  timestamp: string;
  status: "MENUNGGU" | "TERTANGANI" | "MENUJU_LOKASI";
  reporter_name?: string;
  reporter_uid?: string | null;
  reporter_email?: string | null;
  reporter_profile?: any;
  rescuer?: {
    name: string;
    rating: number;
    distance_m: number;
    arrival_time_min: number;
    avatar: string;
  } | null;
}

// Default simulated incidents are kept empty for a clean state
let incidents: Incident[] = [];

// Initialize Firestore
let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const firebaseApp = initializeApp(config);
    db = config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)"
      ? getFirestore(firebaseApp, config.firestoreDatabaseId)
      : getFirestore(firebaseApp);
    console.log("Firestore successfully connected to database ID:", config.firestoreDatabaseId || "(default)");
    
    // Read existing real reports if db has any
    setTimeout(async () => {
      try {
        const colRef = collection(db, "incidents");
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          console.log("Loading active reports into memory cache...");
          const list: Incident[] = [];
          snap.forEach((d) => list.push(d.data() as Incident));
          list.sort((a, b) => {
            const idA = parseInt(a.id.replace("inc-", "")) || 0;
            const idB = parseInt(b.id.replace("inc-", "")) || 0;
            return idB - idA;
          });
          incidents = list;
        }
      } catch (seedErr) {
        console.error("Failed to query Firestore collection:", seedErr);
      }
    }, 1000);
  } else {
    console.warn("firebase-applet-config.json not found. Operating with fallback memory db.");
  }
} catch (err) {
  console.error("Failed to initialize Firestore database:", err);
}

// Lazy-initialize Gemini SDK
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini API Client successfully initialized.");
    } else {
      console.warn("GEMINI_API_KEY environment variable is not defined or is placeholder. Using smart simulation mode.");
    }
  }
  return ai;
}

// API: Get Google Maps Platform API Key dynamically
app.get("/api/maps-key", (req, res) => {
  res.json({ key: process.env.GOOGLE_MAPS_PLATFORM_KEY || "" });
});

// API: Get all active incidents
app.get("/api/incidents", async (req, res) => {
  if (db) {
    try {
      const colRef = collection(db, "incidents");
      const snap = await getDocs(colRef);
      const list: Incident[] = [];
      snap.forEach((d) => list.push(d.data() as Incident));
      list.sort((a, b) => {
        const idA = parseInt(a.id.replace("inc-", "")) || 0;
        const idB = parseInt(b.id.replace("inc-", "")) || 0;
        return idB - idA;
      });
      incidents = list;
    } catch (err) {
      console.error("Error reading incidents from live Firestore, using memory fallback:", err);
    }
  }
  res.json({ status: "success", data: incidents });
});

// API: Reset database
app.post("/api/incidents/reset", async (req, res) => {
  incidents = [
    {
      id: "inc-1",
      lat: -7.2589,
      lng: 112.7388,
      valid: true,
      kategori: "MEKANIK",
      tingkat_darurat: 7,
      ringkasan_masalah: "Ban motor matic bocor halus di pinggir jalan raya. Ban belakang kempes total.",
      lokasi_deskripsi: "Jl. Tunjungan No.1, Surabaya (Depan Tunjungan Plaza, jalur pejalan kaki)",
      rekomendasi_alat: ["Pompa Portable", "Alat Tambal Kilat", "Kunci Pas 12/14"],
      radius_notifikasi_meter: 1000,
      timestamp: "1 menit lalu",
      status: "MENUNGGU",
      reporter_name: "Yogi Pratama",
      rescuer: null
    },
    {
      id: "inc-2",
      lat: -7.2654,
      lng: 112.7512,
      valid: true,
      kategori: "MEDIS",
      tingkat_darurat: 9,
      ringkasan_masalah: "Pengendara sepeda ontel pingsan tiba-tiba akibat dehidrasi terik matahari.",
      lokasi_deskripsi: "Jl. Stasiun Gubeng, Surabaya (Dekat pintu masuk timur)",
      rekomendasi_alat: ["P3K Kit", "Air Minum", "Oksigen Portable"],
      radius_notifikasi_meter: 1500,
      timestamp: "3 menit lalu",
      status: "MENUJU_LOKASI",
      reporter_name: "Ina Rosdiana",
      rescuer: {
        name: "Budi Santoso",
        rating: 4.9,
        distance_m: 850,
        arrival_time_min: 2,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
      }
    }
  ];

  if (db) {
    try {
      // Refresh matching Firestore documents
      for (const inc of incidents) {
        await setDoc(doc(db, "incidents", inc.id), inc);
      }
      console.log("Firestore reset written successfully.");
    } catch (err) {
      console.error("Firestore database reset write error:", err);
    }
  }

  res.json({ status: "success", data: incidents });
});

// API: Accept / dispatch volunteer to a specific incident
app.post("/api/incidents/:id/accept", async (req, res) => {
  const { id } = req.params;
  const { rescuerName, rescuerAvatar } = req.body;
  const incidentIdx = incidents.findIndex((item) => item.id === id);

  if (incidentIdx !== -1) {
    const updatedRescuer = {
      name: rescuerName || "Budi Santoso",
      rating: 4.9,
      distance_m: 650,
      arrival_time_min: 2,
      avatar: rescuerAvatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
    };

    incidents[incidentIdx].status = "MENUJU_LOKASI";
    incidents[incidentIdx].rescuer = updatedRescuer;

    if (db) {
      try {
        await setDoc(doc(db, "incidents", id), incidents[incidentIdx]);
        console.log(`Incident ${id} update successfully written to Firestore.`);
      } catch (err) {
        console.error("Firestore update incident error:", err);
      }
    }

    return res.json({ status: "success", data: incidents[incidentIdx] });
  }

  res.status(404).json({ status: "error", message: "Incident not found" });
});

// API: Cancel volunteer action
app.post("/api/incidents/:id/cancel", async (req, res) => {
  const { id } = req.params;
  const incidentIdx = incidents.findIndex((item) => item.id === id);

  if (incidentIdx !== -1) {
    incidents[incidentIdx].status = "MENUNGGU";
    incidents[incidentIdx].rescuer = null;
    
    if (db) {
      try {
        await setDoc(doc(db, "incidents", id), incidents[incidentIdx]);
      } catch (err) {}
    }
    return res.json({ status: "success", data: incidents[incidentIdx] });
  }
  res.status(404).json({ status: "error", message: "Incident not found" });
});

// API: Finish / Resolve incident
app.post("/api/incidents/:id/finish", async (req, res) => {
  const { id } = req.params;
  const incidentIdx = incidents.findIndex((item) => item.id === id);

  if (incidentIdx !== -1) {
    incidents[incidentIdx].status = "TERTANGANI";
    
    if (db) {
      try {
        await setDoc(doc(db, "incidents", id), incidents[incidentIdx]);
      } catch (err) {}
    }
    return res.json({ status: "success", data: incidents[incidentIdx] });
  }
  res.status(404).json({ status: "error", message: "Incident not found" });
});

// API: Process SOS with Multi-modal AI input
app.post("/api/sos", async (req, res) => {
  const { imageBase64, audioBase64, latitude, longitude, locationText, mockType, reporterName, reporterUid, reporterProfile } = req.body;

  const latNum = parseFloat(latitude) || -7.250444;
  const lngNum = parseFloat(longitude) || 112.768845;

  console.log(`Received SOS report. Lat: ${latNum}, Lng: ${lngNum}, Address: ${locationText || "Nasional"}`);

  // Base prompt instructions for dispatcher triage
  const systemPrompt = `Anda adalah Agen Penyelamat Publik (Smart Dispatcher) Nasional Indonesia. Analisis input multi-modal (Gambar, Audio, atau deskripsi teks) dan koordinat GPS ini.
Tugas Anda:
1. Validasi: Apakah ini prank atau darurat valid? (Contoh prank: gambar layar hitam kosong, suara tertawa main-main, dsb. Contoh darurat valid: kendaraan mogok/ban bocor, orang kecelakaan/sakit, kejahatan, bencana dsb).
2. Klasifikasi: Kategori (MEDIS, MEKANIK, KEAMANAN, LINGKUNGAN).
3. Ekstraksi: Ekstrak ringkasan_masalah bahasa Indonesia yang ringkas dan padat (maks 2 kalimat), tingkat panik (1-10) sebagai tingkat_darurat, dan daftar rekomendasi_alat yang rasional.
4. Tentukan radius_notifikasi_meter (biasanya antara 500 sampai 2000 meter tergantung urgensi kejadian).

HANYA kembalikan output dalam format JSON terstruktur persis seperti ini:
{
  "valid": true,
  "kategori": "MEDIS",
  "tingkat_darurat": 8,
  "ringkasan_masalah": "Deskripsi singkat yang jelas dan padat.",
  "rekomendasi_alat": ["alat_1", "alat_2"],
  "radius_notifikasi_meter": 1200
}`;

  let finalTriage: any = null;
  let isSimulated = false;

  const client = getGeminiClient();

  if (client) {
    try {
      const parts: any[] = [{ text: systemPrompt }];

      // Append GPS coords context
      parts.push({ text: `Koordinat kejadian: Latitude: ${latNum}, Longitude: ${lngNum}. Deskripsi Lokasi Terdeteksi: ${locationText || "Lokasi Terdeteksi"}` });

      if (imageBase64) {
        // Strip data prefix if existing
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: cleanBase64
          }
        });
      }

      if (audioBase64) {
        const cleanBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, "");
        parts.push({
          inlineData: {
            mimeType: "audio/webm",
            data: cleanBase64
          }
        });
      }

      if (mockType) {
        parts.push({ text: `Konteks Situasi Kejadian: ${mockType}` });
      }

      console.log("Calling Gemini API 'gemini-2.5-flash' for autonomous triage...");
      
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              valid: { type: Type.BOOLEAN },
              kategori: { type: Type.STRING, description: "MEDIS, MEKANIK, KEAMANAN, or LINGKUNGAN" },
              tingkat_darurat: { type: Type.INTEGER, description: "Panic scale 1-10" },
              ringkasan_masalah: { type: Type.STRING, description: "Summarize the emergency clearly" },
              rekomendasi_alat: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              radius_notifikasi_meter: { type: Type.INTEGER }
            },
            required: ["valid", "kategori", "tingkat_darurat", "ringkasan_masalah", "rekomendasi_alat", "radius_notifikasi_meter"]
          }
        }
      });

      if (response && response.text) {
        try {
          const parsed = JSON.parse(response.text.trim());
          if (parsed && typeof parsed === "object") {
            finalTriage = parsed;
            console.log("Gemini triage outcome received:", finalTriage);
          }
        } catch (jsonErr) {
          console.error("JSON parsing error on Gemini output", jsonErr, response.text);
        }
      }
    } catch (apiErr) {
      console.error("Error invoking Gemini API:", apiErr);
    }
  }

  // Fallback to offline smart simulation if the key is missing or is throwing an error
  if (!finalTriage) {
    isSimulated = true;
    console.log("Using backend smart simulation algorithm due to missing key or API failure.");

    if (mockType === "MEDIS" || (mockType && mockType.toUpperCase().includes("MEDIS"))) {
      finalTriage = {
        valid: true,
        kategori: "MEDIS",
        tingkat_darurat: 9,
        ringkasan_masalah: "Kondisi darurat medis dilaporkan di Jl. Tunjungan Surabaya. Pelapor pingsan atau membutuhkan pertolongan pertomongan pertama segera.",
        rekomendasi_alat: ["P3K Kit", "Air Mineral", "Tandu Lipat"],
        radius_notifikasi_meter: 1500
      };
    } else if (mockType === "MEKANIK" || (mockType && mockType.toUpperCase().includes("MEKANIK")) || (imageBase64 && imageBase64.includes("tire"))) {
      finalTriage = {
        valid: true,
        kategori: "MEKANIK",
        tingkat_darurat: 6,
        ringkasan_masalah: "Laporan bantuan mekanik jalan raya: Ban motor bocor di sekitar Jl. Tunjungan Surabaya. Membutuhkan bantuan tambal ban segera.",
        rekomendasi_alat: ["Pompa Portable", "Cukil Ban", "Klem Tambal Kilat"],
        radius_notifikasi_meter: 1000
      };
    } else if (mockType === "KEAMANAN" || (mockType && mockType.toUpperCase().includes("KEAMANAN"))) {
      finalTriage = {
        valid: true,
        kategori: "KEAMANAN",
        tingkat_darurat: 8,
        ringkasan_masalah: "Masalah keamanan lingkungan terdeteksi. Warga membutuhkan kehadiran pertolongan darurat atau saksi mata di lokasi Surabaya.",
        rekomendasi_alat: ["Senter Sorot", "Kamera Perekam", "Alat Keamanan Mandiri"],
        radius_notifikasi_meter: 1200
      };
    } else {
      // General random but realistic fallback
      finalTriage = {
        valid: true,
        kategori: "MEKANIK",
        tingkat_darurat: 7,
        ringkasan_masalah: locationText ? `Kejadian dilaporkan di ${locationText}. Layanan Smart Dispatcher mendeteksi keadaan darurat valid.` : "Ban motor bocor atau masalah mesin di persimpangan jalan Surabaya, pelapor membutuhkan alat pendukung.",
        rekomendasi_alat: ["Kunci Inggris", "Pompa Portable", "Senter"],
        radius_notifikasi_meter: 1000
      };
    }
  }

  // Generate a random ID and add this incident to our live list
  const newIncident: Incident = {
    id: `inc-${Date.now()}`,
    lat: latNum,
    lng: lngNum,
    valid: finalTriage.valid,
    kategori: finalTriage.kategori || "MEKANIK",
    tingkat_darurat: finalTriage.tingkat_darurat || 7,
    ringkasan_masalah: finalTriage.ringkasan_masalah || "Keadaan darurat dilaporkan.",
    lokasi_deskripsi: locationText || "Jl. Tunjungan No.1, Surabaya",
    rekomendasi_alat: finalTriage.rekomendasi_alat || ["Pompa Portable"],
    radius_notifikasi_meter: finalTriage.radius_notifikasi_meter || 1000,
    timestamp: "Baru saja",
    status: "MENUNGGU",
    reporter_name: reporterName || "Korban Darurat (Anda)",
    reporter_uid: reporterUid || null,
    reporter_profile: reporterProfile || null,
    rescuer: null
  };

  if (newIncident.valid) {
    incidents.unshift(newIncident); // Push to front
    if (db) {
      try {
        await setDoc(doc(db, "incidents", newIncident.id), newIncident);
        console.log(`New SOS incident ${newIncident.id} successfully written to Firestore.`);
      } catch (err) {
        console.error("Firestore SOS create error:", err);
      }
    }
  }

  res.json({
    status: "success",
    isSimulated: isSimulated,
    data: newIncident
  });
});

// API: Agentic AI Conversational interface
app.post("/api/agent", async (req, res) => {
  const { query, activeCategory, locationContext, imageBase64 } = req.body;
  if (!query && !imageBase64) return res.status(400).json({ error: "Missing query parameter" });

  const client = getGeminiClient();
  const systemPrompt = `Anda adalah Agent Wirasaga AI, penasihat rescue, medis/P3K, keselamatan umum, evakuasi, dan kendala mekanik taktis yang cerdas untuk seluruh masyarakat Indonesia.

SANGAT PENTING - DIBAWAH ADALAH BATASAN KETAT (GUARDRAILS) ANDA:
- Anda HANYA diperbolehkan menjawab pertanyaan yang berhubungan dengan:
  1. Keadaan darurat (kebakaran, gempa bumi, banjir, kecelakaan lalu lintas).
  2. Pertolongan Pertama Medis (P3K) (pingsan, pendarahan, asfiksia, luka bakar, patah tulang, serangan jantung).
  3. Keselamatan umum dan kendala kriminalitas (begal, maling, pelecehan, ancaman fisik).
  4. Masalah kendaraan jalan raya (ban bocor, kempes, mogok, overheat).
  5. Kontak darurat, nomor polisi, ambulans, pemadam kebakaran, dan cara mengevakuasi diri.
- Jika pengguna bertanya di luar jangkauan topik di atas (seperti resep makanan, menulis kode pemrograman, memecahkan matematika, politik, gosip artis, meminta karangan fiksi umum, dll), Anda HARUS MENOLAK DENGAN SOPAN dalam Bahasa Indonesia. Katakan dengan ramah bahwa Anda dikalibrasi khusus hanya untuk membantu panduan taktis kesiapsiagaan darurat demi keselamatan jiwa.
- Berikan saran yang ringkas, praktis, taktis, bermutu tinggi, dan suportif. Fokus pada instruksi langkah demi langkah agar mudah dibaca oleh korban yang panik.
- Berikan respon dalam Bahasa Indonesia yang lugas dan menenangkan. Maksimal 4 kalimat.`;

  if (client) {
    try {
      console.log(`Calling server-side Gemini 2.5 Flash for agent reasoning on: "${query || 'Gambar'}"`);
      const parts: any[] = [{ text: `${systemPrompt}\n\nPertanyaan Warga: "${query || 'Jelaskan atau bantu saya mengenai foto ini:'}"` }];
      
      if (imageBase64) {
        const base64Data = imageBase64.split(",")[1];
        const mimeType = imageBase64.split(",")[0].split(":")[1].split(";")[0];
        if (base64Data && mimeType) {
          parts.push({ inlineData: { data: base64Data, mimeType } });
        }
      }

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts }
      });
      if (response && response.text) {
        return res.json({ status: "success", reply: response.text.trim() });
      }
    } catch (err) {
      console.error("Agentic AI error on Gemini API call:", err);
    }
  }

  // Fallback smart offline advisor state engine with strict guardrails
  let replyFallback = "Mohon maaf, sebagai Asisten Wirasaga AI, saya hanya diperkenankan untuk melayani pertanyaan seputar kesiapsiagaan darurat, P3K, keselamatan umum, evakuasi bencana, dan kebutuhan bantuan teknis jalan raya. Silakan tanyakan hal-hal yang relevan demi menjaga keselamatan bersama.";
  const qLower = query.toLowerCase();

  // Validate on-topic keywords for fallback
  const isOnTopic = [
    "pingsan", "medis", "nafas", "luka", "sakit", "p3k", "darurat",
    "ban", "bocor", "mekanik", "kempes", "mogok", "aki", "mesin",
    "api", "kebakaran", "pemadam", "bencana", "gempa", "banjir", "evakuasi",
    "maling", "begal", "aman", "bahaya", "polisi", "tandu", "ambulan", "rs", "rumah sakit",
    "kucing", "anjing", "hewan", "keamanan", "senter", "penyelamatan", "tolong", "bantu", "kontak", "nomor"
  ].some(keyword => qLower.includes(keyword));

  if (isOnTopic) {
    if (qLower.includes("pingsan") || qLower.includes("medis") || qLower.includes("nafas") || qLower.includes("luka") || qLower.includes("sakit") || qLower.includes("p3k")) {
      replyFallback = "Pertolongan Pertama Medis: Baringkan korban di tempat rata dan teduh. Naikkan kaki korban sedikit lebih tinggi dari jantung. Longgarkan kancing baju. Laporkan lokasi tepat Anda agar relawan P3K kami bisa langsung mengintervensi dengan oksigen portable.";
    } else if (qLower.includes("ban") || qLower.includes("bocor") || qLower.includes("mekanik") || qLower.includes("kempes") || qLower.includes("mogok")) {
      replyFallback = "Langkah Mandiri Mekanik: Nyalakan lampu darurat hazard. Ganjal ban di sisi berlawanan sebelum mendongkrak. Gunakan cairan anti-bocor jika mendesak. Relawan terdekat kami membawa pompa portable elektrik!";
    } else if (qLower.includes("api") || qLower.includes("kebakaran") || qLower.includes("pemadam")) {
      replyFallback = "Siaga Kebakaran: Jangan gunakan lift jika berada di gedung. Gunakan Alat Pemadam Api Ringan (APAR) dengan metode PASS (Pull, Aim, Squeeze, Sweep). Evakuasi ke titik kumpul terbuka sekarang.";
    } else if (qLower.includes("maling") || qLower.includes("begal") || qLower.includes("aman") || qLower.includes("bahaya") || qLower.includes("keamanan")) {
      replyFallback = "Keamanan Mandiri: Hindari konfrontasi langsung. Cari tempat ramai/pos polisi terdekat. Aktifkan fitur Sirene di menu aplikasi Wirasaga sekarang untuk menarik kawalan warga gotong royong.";
    } else if (qLower.includes("kontak") || qLower.includes("nomor") || qLower.includes("rs") || qLower.includes("polisi") || qLower.includes("pemadam")) {
      replyFallback = "Anda bisa menghubungi Nomor Panggilan Darurat Siaga 112 secara gratis. Untuk kepolisian hubungi 110, Ambulans 118/119, atau masuk ke tab 'Telepon Darurat' di bawah untuk melakukan panggilan langsung.";
    } else {
      replyFallback = "Mohon tetap tenang. Jauhi area berbahaya. Tarik napas secara teratur. Laporkan melalui tombol SOS agar tim Wirasaga Relawan terdekat atau petugas dinas bisa segera menuju ke koordinasi GPS Anda.";
    }
  }

  return res.json({ status: "success", reply: replyFallback });
});

// Setup Vite middleware for development or Static Asset serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite middleware after the API routes
    app.use(vite.middlewares);
  } else {
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Wirasaga Server successfully booted and running on http://localhost:${PORT}`);
  });
}

startServer();
