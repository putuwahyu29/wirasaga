export interface Rescuer {
  name: string;
  rating: number;
  distance_m: number;
  arrival_time_min: number;
  avatar: string;
}

export interface Incident {
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
  rescuer?: Rescuer | null;
}

export type AppView = "DASHBOARD" | "ANALYSIS" | "ALERT_DETAIL" | "TRACKER" | "INCIDENT_FEED" | "AGENT_CHAT" | "EMERGENCY_CONTACTS" | "PROFILE" | "SETTINGS";
