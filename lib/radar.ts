// ---------------------------------------------------------------------------
// Konfigurasi radar hujan MSS (Meteorological Service Singapore) — jangkauan 240 km.
//
// Gambar radar: PNG transparan 480x480 px, update tiap 15 menit.
// Pola URL: https://www.weather.gov.sg/files/rainarea/240km/dpsri_240km_<YYYYMMDDHHMM>0000dBR.dpsri.png
// Timestamp di nama file pakai jam Singapura (SGT = WIB + 1 jam).
// ---------------------------------------------------------------------------

export type Frame = {
  url: string; // URL PNG radar
  ts: string; // timestamp SGT mentah, "YYYYMMDDHHMM"
  wib: string; // label siap-tampil dalam WIB, mis. "Sab, 13 Jun 22.15"
};

// Leaflet butuh bounds [[south, west], [north, east]] = [[lat_min,lng_min],[lat_max,lng_max]].
//
// CATATAN KALIBRASI: MSS nggak mempublikasikan bounding box gambar 240 km, dan
// gambar radarnya nggak punya garis pantai buat dicocokin. Angka di bawah ini
// ESTIMASI terukur: gambar 480 px diasumsikan 480 km (1 km/px) berpusat di titik
// origin grid (1.3155 N, 103.8475 E) — pusat gambar 50 km MSS yang bounds-nya presisi.
// Batam ada persis di dekat pusat gambar, jadi error overlay di area Batam minimal.
// Kalau pas hujan ada selisih posisi, tinggal geser 4 angka ini.
export const RADAR_BOUNDS: [[number, number], [number, number]] = [
  [-0.855, 101.691], // SW (lat_min, lng_min)
  [3.486, 106.004], // NE (lat_max, lng_max)
];

// Tampilan awal peta: Batam + Bintan + ujung selatan Singapura kelihatan.
export const MAP_CENTER: [number, number] = [1.08, 103.98];
export const DEFAULT_ZOOM = 9;
export const MIN_ZOOM = 7;
export const MAX_ZOOM = 13;

// Batas geser peta supaya nggak nyasar keluar jangkauan radar.
export const MAX_BOUNDS: [[number, number], [number, number]] = RADAR_BOUNDS;

// Penanda kota buat orientasi.
export const PLACES: { name: string; lat: number; lng: number }[] = [
  { name: "Singapura", lat: 1.29, lng: 103.85 },
  { name: "Batam", lat: 1.105, lng: 104.045 },
  { name: "Tg. Balai Karimun", lat: 1.083, lng: 103.43 },
  { name: "Tg. Pinang", lat: 0.918, lng: 104.456 },
];

// Skala warna intensitas hujan radar MSS (ringan → sangat lebat).
export const LEGEND: { color: string; label: string }[] = [
  { color: "#9ecae1", label: "Ringan" },
  { color: "#41ab5d", label: "Sedang" },
  { color: "#fed976", label: "Agak lebat" },
  { color: "#fd8d3c", label: "Lebat" },
  { color: "#e31a1c", label: "Sangat lebat" },
  { color: "#7a0177", label: "Ekstrem" },
];
