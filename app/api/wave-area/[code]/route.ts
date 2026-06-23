// Detail prakiraan 1 area perairan (buat popup pas tap area laut di mode OMBAK).
// Lazy: dipanggil on-demand saat klik, bukan pre-fetch 8 area.
export const revalidate = 1800;

const CODES = new Set(["D.01", "D.02", "D.08", "E.01", "E.02", "E.03", "E.04", "E.05"]);

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  // validasi ketat: format E.02 + whitelist (data eksternal = jangan dipercaya buta)
  if (!/^[A-Z]\.\d{2}$/.test(code) || !CODES.has(code)) {
    return Response.json({ error: "kode tidak valid" }, { status: 400 });
  }
  try {
    const res = await fetch(`https://peta-maritim.bmkg.go.id/public_api/perairan/${code}.json`, {
      next: { revalidate: 1800 },
      headers: { "User-Agent": "Hujan di Batam" },
    });
    if (!res.ok) return Response.json({ error: "upstream" }, { status: 502 });
    const j = await res.json();
    const data: Array<Record<string, unknown>> = Array.isArray(j?.data) ? j.data : [];
    const periods = data.map((d) => ({
      wave_cat: String(d.wave_cat ?? ""),
      wave_desc: String(d.wave_desc ?? ""),
      weather: String(d.weather ?? ""),
      wind_from: String(d.wind_from ?? ""),
      wind_min: Number(d.wind_speed_min ?? 0),
      wind_max: Number(d.wind_speed_max ?? 0),
      // BMKG isi "NIL" (bukan kosong) kalau tak ada peringatan → jangan tampilkan
      warning: d.warning_desc && d.warning_desc !== "NIL" ? String(d.warning_desc) : null,
    }));
    return Response.json(
      { name: String(j?.name ?? code), issued: j?.issued ?? null, periods },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
    );
  } catch {
    return Response.json({ error: "gagal" }, { status: 500 });
  }
}
