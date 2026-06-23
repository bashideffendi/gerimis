// Pra-proses SEKALI: ambil polygon area perairan BMKG, subset 8 area sekitar Batam,
// strip props ({c,n}) + quantize koordinat 3-desimal → public/data/perairan-batam.json.
// JANGAN fetch ini saat build Vercel (host maritim beda + proxy kantor) — hasilnya
// DI-COMMIT ke repo. Jalankan di mesin yg bisa akses peta-maritim.bmkg.go.id:
//   node scripts/build-waters.mjs
import { writeFile, mkdir } from "node:fs/promises";

const SRC = "https://peta-maritim.bmkg.go.id/public_api/static/wilayah_perairan.json";
// 8 area: 5 Kepri (E.01-E.05) + 3 laut lepas (Laut Natuna Utara, Selat Malaka utara, dll).
const CODES = new Set(["D.01", "D.02", "D.08", "E.01", "E.02", "E.03", "E.04", "E.05"]);
const q = (v) => Number(v.toFixed(3)); // ~110 m, lebih halus dari kebutuhan zoom 7-12

// GeoJSON coords nested: Polygon = [ring][pt][2]; MultiPolygon = [poly][ring][pt][2].
function quantize(coords) {
  if (typeof coords[0] === "number") return [q(coords[0]), q(coords[1])];
  return coords.map(quantize);
}

const res = await fetch(SRC, { headers: { "User-Agent": "Hujan di Batam build" } });
if (!res.ok) throw new Error(`fetch gagal: ${res.status}`);
const gj = await res.json();

const features = (gj.features || [])
  .filter((f) => CODES.has(f?.properties?.WP_1))
  .map((f) => ({
    type: "Feature",
    properties: { c: f.properties.WP_1, n: f.properties.WP_IMM },
    geometry: { type: f.geometry.type, coordinates: quantize(f.geometry.coordinates) },
  }));

const out = { type: "FeatureCollection", features };
await mkdir("public/data", { recursive: true });
const json = JSON.stringify(out);
await writeFile("public/data/perairan-batam.json", json);

const verts = features.reduce(
  (n, f) => n + (JSON.stringify(f.geometry.coordinates).match(/,/g)?.length ?? 0) / 2,
  0,
);
console.log(`${features.length} area · ~${Math.round(verts)} verts · ${(json.length / 1024).toFixed(1)} KB`);
console.log("kode:", features.map((f) => `${f.properties.c} (${f.properties.n})`).join(" | "));
