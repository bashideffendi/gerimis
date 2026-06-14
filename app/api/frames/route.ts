import type { Frame } from "@/lib/radar";

// Citra radar 240km MSS terbit tiap 5 MENIT (dicek langsung di server: file ada
// di tiap kelipatan menit :05). Yang "15 menit" itu cuma daftar slideshow di web
// MSS (mereka under-sample buat animasi). Jadi kita generate timestamp 5-menitan
// sendiri → lebih fresh + animasi lebih mulus + nggak gantung markup halaman MSS.
export const revalidate = 120;

const FILE_BASE = "https://www.weather.gov.sg/files/rainarea/240km";
const STEP_MIN = 5; // cadence file radar
const LAG_MIN = 10; // jeda terbit — file terbaru ~10 menit di belakang "sekarang"
const FRAME_COUNT = 30; // 30 x 5 mnt = 2,5 jam riwayat

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// "YYYYMMDDHHMM" (SGT) -> {time, date} WIB siap tampil. SGT = UTC+8, WIB = UTC+7.
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
  return { url: `${FILE_BASE}/dpsri_240km_${ts}0000dBR.dpsri.png`, ts, time, date };
}

// Generate timestamp 5-menitan SGT, berhenti ~10 menit di belakang (jeda terbit MSS).
function generateFrames(): Frame[] {
  const sgt = new Date(Date.now() + 8 * 3600 * 1000 - LAG_MIN * 60 * 1000);
  sgt.setUTCMinutes(sgt.getUTCMinutes() - (sgt.getUTCMinutes() % STEP_MIN), 0, 0);
  const frames: Frame[] = [];
  for (let i = FRAME_COUNT - 1; i >= 0; i--) {
    const d = new Date(sgt.getTime() - i * STEP_MIN * 60 * 1000);
    const ts =
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
      `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
    frames.push(toFrame(ts));
  }
  return frames;
}

export async function GET() {
  const frames = generateFrames();
  return Response.json(
    { frames, count: frames.length },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } },
  );
}
