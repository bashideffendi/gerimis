# Gerimis

> Radar hujan real-time buat Batam & sekitarnya — data Meteorological Service Singapore.

**Status:** 🟡 Draft
**Live:** https://gerimis.masbash.id _(rencana)_
**Repo:** https://github.com/bashideffendi/gerimis
**Stack:** Next.js 16, React 19, Tailwind 4, Leaflet + react-leaflet

## What

Batam cuma ~25 km selatan Singapura, jadi posisinya pas di tengah jangkauan radar
240 km milik [Meteorological Service Singapore](https://www.weather.gov.sg/weather-rain-area-240km).
Gerimis ngambil citra radar hujan MSS itu, lalu nampilinnya sebagai overlay di atas
peta Batam — biar gampang ngecek "lagi hujan apa nggak" dan dari arah mana awan datang,
tanpa harus baca peta full Singapura.

Semua pengambilan citra radar jalan dari sisi server (route handler) yang nge-parse
daftar frame langsung dari halaman MSS; gambar PNG-nya ditampilin di browser lewat
Leaflet `ImageOverlay` (nggak kena CORS karena cuma dirender, bukan dibaca pixel-nya).

## Features

- ✅ Overlay radar hujan 240 km di atas peta Batam + Bintan + ujung selatan Singapura
- ✅ Time slider 25 frame (≈6 jam ke belakang) + animasi play
- ✅ Auto-refresh daftar frame tiap 5 menit (radar update tiap 15 menit)
- ✅ Label waktu dalam WIB, penanda kota buat orientasi, atur transparansi + legenda intensitas
- 🚧 Kalibrasi presisi bounding box overlay 240 km (lihat catatan di bawah)
- 🚧 PWA / install ke home screen

## Catatan kalibrasi overlay

MSS **nggak mempublikasikan** bounding box geografis citra 240 km, dan citra radarnya
nggak punya garis pantai buat dicocokin. Bounds di `lib/radar.ts` (`RADAR_BOUNDS`) saat
ini **estimasi terukur**: citra 480 px diasumsikan 480 km (1 km/px) berpusat di titik
origin grid (1.3155 N, 103.8475 E) — pusat citra 50 km MSS yang bounds-nya presisi
([referensi cheeaun/rain-geojson-sg](https://github.com/cheeaun/rain-geojson-sg)).

Batam ada persis di dekat pusat citra, jadi error overlay di area Batam minimal. Kalau
pas hujan kelihatan ada selisih posisi, geser 4 angka di `RADAR_BOUNDS`. Kalibrasi paling
akurat: cross-match pola hujan citra 240 km vs citra 50 km (yang georeferensinya presisi)
saat ada hujan di atas Singapura.

## Local Dev

```bash
git clone https://github.com/bashideffendi/gerimis.git
cd gerimis
npm install
npm run build   # CATATAN laptop 12 GB: verifikasi pakai build, JANGAN `npm run dev`
npm start
```

## Environment Variables

Nggak ada. Semua data ditarik dari endpoint publik MSS saat runtime.

## Deploy

- **Platform**: Vercel (auto-deploy tiap push ke `main`)
- **URL**: gerimis.masbash.id
- Route handler `/api/frames` di-cache 5 menit (ISR) biar hemat hit ke MSS.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Peta**: Leaflet 1.9 + react-leaflet 5, basemap CARTO Voyager
- **Styling**: Tailwind CSS 4
- **Data**: citra radar `dpsri_240km` dari weather.gov.sg

## Atribusi

Citra radar hujan © Meteorological Service Singapore (weather.gov.sg).
Basemap © OpenStreetMap contributors, © CARTO.

## License

Personal project. © Bashid Effendi 2026.
