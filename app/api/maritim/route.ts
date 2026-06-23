// UJI matriks: cari endpoint BMKG OFS yg bener buat data gelombang titik Batam.
export const dynamic = "force-dynamic";

const HOST = "https://maritim.bmkg.go.id";
const BATAM = { lat: 1.08, lon: 104.03 };
const UA = "Mozilla/5.0 (Hujan di Batam)";
const BR = "202606230000"; // baserun YYYYMMDDhhmm
const DT = "202606230600"; // forecast +6h

type Probe = { label: string; method: "GET" | "POST"; url: string; body?: unknown };

const PROBES: Probe[] = [
  { label: "grid-hs", method: "GET", url: `${HOST}/pusmar/api23/arr_req/inawaves/hs/${BR}/${DT}` },
  { label: "grid-lat", method: "GET", url: `${HOST}/pusmar/api23/arr_req/inawaves/lat/${BR}/${DT}` },
  { label: "grid-lon", method: "GET", url: `${HOST}/pusmar/api23/arr_req/inawaves/lon/${BR}/${DT}` },
  { label: "grid-meta", method: "GET", url: `${HOST}/pusmar/api23/grid/w3g_hires` },
  { label: "pt-api23", method: "POST", url: `${HOST}/pusmar/api23/point_req`, body: { model: "w3g_hires", modelrun: BR, lon: BATAM.lon, lat: BATAM.lat, var: ["hs"] } },
  { label: "pt-pusmar", method: "POST", url: `${HOST}/pusmar/point_req`, body: { model: "w3g_hires", modelrun: BR, lon: BATAM.lon, lat: BATAM.lat, var: ["hs"] } },
  { label: "pt-root", method: "POST", url: `${HOST}/point_req`, body: { model: "w3g_hires", modelrun: BR, lon: BATAM.lon, lat: BATAM.lat, var: ["hs"] } },
  { label: "pt-iso", method: "POST", url: `${HOST}/pusmar/api23/point_req`, body: { model: "w3g_hires", modelrun: "2026-06-23T00:00:00Z", lon: BATAM.lon, lat: BATAM.lat, var: ["hs"] } },
];

async function run(p: Probe) {
  try {
    const res = await fetch(p.url, {
      method: p.method,
      cache: "no-store",
      headers: { "User-Agent": UA, ...(p.method === "POST" ? { "Content-Type": "application/json" } : {}) },
      ...(p.body ? { body: JSON.stringify(p.body) } : {}),
    });
    const text = await res.text();
    let arrLen: number | null = null;
    try {
      const j = JSON.parse(text);
      if (Array.isArray(j?.data)) arrLen = j.data.length;
    } catch {}
    const isHtml = text.trimStart().startsWith("<");
    return { label: p.label, status: res.status, arrLen, sample: isHtml ? "[HTML/404]" : text.slice(0, 220) };
  } catch (e) {
    return { label: p.label, status: "ERR", sample: String(e).slice(0, 160) };
  }
}

export async function GET() {
  const results = await Promise.all(PROBES.map(run));
  return Response.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
