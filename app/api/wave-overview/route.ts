// Kategori gelombang 8 area sekitar Batam dari overview BMKG (4 periode prakiraan).
// Plus window valid tiap periode (dari detail E.02) → client buka di periode yg nutupin
// JAM SEKARANG (nowIndex), bukan label "Hari ini" yg bisa basi sore-sore.
export const revalidate = 1800; // BMKG terbit ~2x/hari

const BASE = "https://peta-maritim.bmkg.go.id/public_api";
const CODES = ["D.01", "D.02", "D.08", "E.01", "E.02", "E.03", "E.04", "E.05"];
const KEYS = ["today", "tomorrow", "h2", "h3"] as const;
const UA = "Hujan di Batam";

// "2026-06-22 12:00 UTC" → epoch ms
function parseBmkgUtc(s: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(s);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : NaN;
}

export async function GET() {
  try {
    const [ovRes, e02Res] = await Promise.all([
      fetch(`${BASE}/overview/gelombang.json`, {
        next: { revalidate: 1800 },
        headers: { "User-Agent": UA },
      }),
      fetch(`${BASE}/perairan/E.02.json`, {
        next: { revalidate: 1800 },
        headers: { "User-Agent": UA },
      }),
    ]);
    const ov = await ovRes.json();

    const areas: Record<string, Record<string, string>> = {};
    let issued: string | null = null;
    for (const c of CODES) {
      const a = ov?.[c];
      if (!a) continue;
      areas[c] = { today: a.today, tomorrow: a.tomorrow, h2: a.h2, h3: a.h3 };
      if (!issued && a.issued) issued = a.issued;
    }

    // window valid per periode dari detail E.02 (sama buat semua area se-region)
    const e02 = await e02Res.json().catch(() => null);
    const data: Array<Record<string, unknown>> = Array.isArray(e02?.data) ? e02.data : [];
    const now = Date.now();
    const periods = KEYS.map((key, i) => {
      const d = data[i] ?? {};
      const from = parseBmkgUtc(String(d.valid_from));
      const to = parseBmkgUtc(String(d.valid_to));
      return {
        key,
        from: Number.isFinite(from) ? from : null,
        to: Number.isFinite(to) ? to : null,
      };
    });
    let nowIndex = periods.findIndex((p) => p.from != null && p.to != null && p.from <= now && now < p.to);
    if (nowIndex < 0) nowIndex = periods.findIndex((p) => p.from != null && p.from > now);
    if (nowIndex < 0) nowIndex = periods.length ? periods.length - 1 : 0;

    return Response.json(
      { issued: issued ?? e02?.issued ?? null, periods, nowIndex, areas },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
    );
  } catch {
    return Response.json({ issued: null, periods: [], nowIndex: 0, areas: {} });
  }
}
