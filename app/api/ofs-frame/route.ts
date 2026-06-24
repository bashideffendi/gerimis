// Frame field gelombang OFS BMKG (WAVEWATCH III hi-res, "w3g_hires", param swh =
// significant wave height). Disajikan sebagai TMS tile pre-colored (contourf) →
// mulus & nol-lubang, beda dari choropleth per-area. Tile 3-jaman, horizon ~7 hari.
// force-dynamic + no-store: baserun & nowIndex tergantung "sekarang" (gotcha jam-beku).
export const dynamic = "force-dynamic";

const HOST = "https://peta-maritim.bmkg.go.id";
const STEP_H = 3; // tile tersedia tiap 3 jam (terverifikasi: +1h 404, +3h 200)
const HORIZON_H = 72; // 3 hari ke depan = 25 frame (sepadan slider radar)

function fmt(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(
    d.getUTCMinutes(),
  )}`;
}

export async function GET() {
  try {
    const res = await fetch(`${HOST}/api21/modelrun`, {
      cache: "no-store",
      headers: { "User-Agent": "Hujan di Batam" },
    });
    const j = await res.json();
    const baseIso: string | undefined = j?.w3g_hires?.[0];
    if (!baseIso) throw new Error("no run");
    const base = new Date(baseIso);
    const baserun = fmt(base);

    const now = Date.now();
    const frames: { valid: string; t: number }[] = [];
    for (let h = 0; h <= HORIZON_H; h += STEP_H) {
      const d = new Date(base.getTime() + h * 3600 * 1000);
      frames.push({ valid: fmt(d), t: d.getTime() });
    }
    // frame yang nutupin sekarang = step 3-jam terakhir yang <= now
    let nowIndex = 0;
    for (let i = 0; i < frames.length; i++) if (frames[i].t <= now) nowIndex = i;

    return Response.json(
      { baserun, frames: frames.map((f) => f.valid), nowIndex },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ baserun: null, frames: [], nowIndex: 0 });
  }
}
