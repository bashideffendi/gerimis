import type { Frame } from "@/lib/radar";

// Cache hasil 5 menit (radar update tiap 15 menit) — hemat hit ke MSS + cold start.
export const revalidate = 300;

const MSS_PAGE = "https://www.weather.gov.sg/weather-rain-area-240km";
const FILE_BASE = "https://www.weather.gov.sg/files/rainarea/240km";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// "YYYYMMDDHHMM" (SGT) -> label WIB siap tampil. SGT = UTC+8, WIB = UTC+7.
function tsToWib(ts: string): string {
  if (ts.length < 12) return "";
  const y = +ts.slice(0, 4);
  const mo = +ts.slice(4, 6);
  const d = +ts.slice(6, 8);
  const h = +ts.slice(8, 10);
  const mi = +ts.slice(10, 12);
  const utcMs = Date.UTC(y, mo - 1, d, h, mi) - 8 * 3600 * 1000; // SGT -> instant UTC
  const date = new Date(utcMs);
  return date
    .toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/\./g, ".");
}

function toFrame(url: string): Frame | null {
  const m = url.match(/dpsri_240km_(\d{12})\d*dBR/);
  if (!m) return null;
  const ts = m[1];
  return { url, ts, wib: tsToWib(ts) };
}

// Jalur utama: parse daftar frame langsung dari halaman MSS (slideshowimages(...)).
function parseFromPage(html: string): Frame[] {
  const call = html.match(/slideshowimages\(([\s\S]*?)\)\s*;/);
  if (!call) return [];
  const urls = [...call[1].matchAll(/"(https?:\/\/[^"]+?\.png)"/g)].map((x) => x[1]);
  return urls.map(toFrame).filter((f): f is Frame => f !== null);
}

// Cadangan: kalau markup MSS berubah, generate 25 timestamp 15-menitan terakhir (SGT).
function generateFrames(count = 25): Frame[] {
  const nowSgt = new Date(Date.now() + 8 * 3600 * 1000); // geser ke wall-clock SGT
  const floorMin = nowSgt.getUTCMinutes() - (nowSgt.getUTCMinutes() % 15);
  nowSgt.setUTCMinutes(floorMin, 0, 0);
  const frames: Frame[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(nowSgt.getTime() - i * 15 * 60 * 1000);
    const ts =
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
      `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
    const url = `${FILE_BASE}/dpsri_240km_${ts}0000dBR.dpsri.png`;
    const f = toFrame(url);
    if (f) frames.push(f);
  }
  return frames;
}

export async function GET() {
  let frames: Frame[] = [];
  try {
    const res = await fetch(MSS_PAGE, {
      next: { revalidate: 300 },
      headers: { "User-Agent": "Mozilla/5.0 (Gerimis radar viewer)" },
    });
    if (res.ok) frames = parseFromPage(await res.text());
  } catch {
    // diam — fallback di bawah
  }

  if (frames.length === 0) frames = generateFrames();

  return Response.json(
    { frames, count: frames.length },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
