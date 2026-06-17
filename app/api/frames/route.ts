import type { Frame } from "@/lib/radar";

// Citra radar 240km MSS terbit tiap 5 MENIT dengan jeda terbit ~8 menit (dicek
// langsung di server). Daripada nebak jeda pakai angka tetap, server PROBE file
// paling baru yang BENERAN udah terbit, lalu susun 30 frame mundur dari situ →
// selalu sefresh mungkin, nggak pernah nampilin frame kosong (404) sebagai "terbaru".
// Dynamic + no-store: respons SELALU dihitung ulang per request (jam frame selalu
// terbaru). Kalau di-ISR/cache, timestamp-nya beku di waktu generate (bug "selalu
// buka jam 09.15"). Probe ke MSS tetap ringan (file ~16KB, traffic personal).
export const dynamic = "force-dynamic";

const FILE_BASE = "https://www.weather.gov.sg/files/rainarea/240km";
const STEP_MIN = 5; // cadence file radar
const FRAME_COUNT = 30; // 30 x 5 mnt = 2,5 jam riwayat
const PROBE = 4; // berapa kandidat terbaru yang dicek (cover jeda terbit s/d ~15 mnt)

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Date (UTC field = wall-clock SGT) -> "YYYYMMDDHHMM"
function tsOf(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`
  );
}

function urlFor(ts: string): string {
  return `${FILE_BASE}/dpsri_240km_${ts}0000dBR.dpsri.png`;
}

// "YYYYMMDDHHMM" (SGT) -> {time, date} WIB. SGT = UTC+8, WIB = UTC+7.
function tsToWib(ts: string): { time: string; date: string } {
  const y = +ts.slice(0, 4),
    mo = +ts.slice(4, 6),
    d = +ts.slice(6, 8),
    h = +ts.slice(8, 10),
    mi = +ts.slice(10, 12);
  const instant = new Date(Date.UTC(y, mo - 1, d, h, mi) - 8 * 3600 * 1000); // SGT -> instant UTC
  const opts = { timeZone: "Asia/Jakarta" } as const;
  const time = instant.toLocaleString("id-ID", { ...opts, hour: "2-digit", minute: "2-digit" });
  const date = instant.toLocaleString("id-ID", {
    ...opts,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return { time, date };
}

function toFrame(ts: string): Frame {
  const { time, date } = tsToWib(ts);
  return { url: urlFor(ts), ts, time, date };
}

async function exists(ts: string): Promise<boolean> {
  try {
    const r = await fetch(urlFor(ts), { next: { revalidate: 60 } });
    return r.ok;
  } catch {
    return false;
  }
}

// Timestamp file terbaru yang udah terbit — probe paralel mundur dari "sekarang" SGT.
async function newestTs(): Promise<{ ts: string; found: boolean }> {
  const start = new Date(Date.now() + 8 * 3600 * 1000); // wall-clock SGT
  start.setUTCMinutes(start.getUTCMinutes() - (start.getUTCMinutes() % STEP_MIN), 0, 0);
  const cands: string[] = [];
  for (let i = 0; i < PROBE; i++) cands.push(tsOf(new Date(start.getTime() - i * STEP_MIN * 60000)));
  const oks = await Promise.all(cands.map((ts) => exists(ts)));
  const i = oks.findIndex(Boolean);
  return i >= 0 ? { ts: cands[i], found: true } : { ts: cands[cands.length - 1], found: false };
}

function framesEndingAt(endTs: string): Frame[] {
  const y = +endTs.slice(0, 4),
    mo = +endTs.slice(4, 6) - 1,
    d = +endTs.slice(6, 8),
    h = +endTs.slice(8, 10),
    mi = +endTs.slice(10, 12);
  const end = new Date(Date.UTC(y, mo, d, h, mi)); // UTC field = wall-clock SGT
  const frames: Frame[] = [];
  for (let k = FRAME_COUNT - 1; k >= 0; k--) {
    frames.push(toFrame(tsOf(new Date(end.getTime() - k * STEP_MIN * 60000))));
  }
  return frames;
}

export async function GET() {
  const { ts: endTs, found } = await newestTs();
  const frames = framesEndingAt(endTs);
  // umur frame terbaru (menit). instant asli = endTs(SGT) - 8 jam.
  const y = +endTs.slice(0, 4),
    mo = +endTs.slice(4, 6) - 1,
    d = +endTs.slice(6, 8),
    h = +endTs.slice(8, 10),
    mi = +endTs.slice(10, 12);
  const endInstant = Date.UTC(y, mo, d, h, mi) - 8 * 3600 * 1000;
  const ageMinutes = Math.round((Date.now() - endInstant) / 60000);
  // stale: MSS nggak nerbitin apa-apa (found=false) atau frame terbaru > 18 mnt
  const stale = !found || ageMinutes > 18;
  return Response.json(
    { frames, count: frames.length, stale, ageMinutes },
    { headers: { "Cache-Control": "no-store" } },
  );
}
