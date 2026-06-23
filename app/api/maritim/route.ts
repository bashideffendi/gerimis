// UJI: ambil data gelombang BMKG OFS di titik Batam via point_req.
// (Sementara — buat lihat format respons. Nanti dilebur ke /api/conditions.)
export const dynamic = "force-dynamic";

const BASE = "https://maritim.bmkg.go.id/pusmar/api23";
const BATAM = { lat: 1.08, lon: 104.03 };
const UA = "Mozilla/5.0 (Hujan di Batam)";

export async function GET() {
  try {
    const mrRes = await fetch(`${BASE}/modelrun`, {
      cache: "no-store",
      headers: { "User-Agent": UA },
    });
    const modelrun = await mrRes.json().catch(() => null);
    const baserun = modelrun?.w3g_hires?.[0] ?? null;

    const prRes = await fetch(`${BASE}/point_req`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "User-Agent": UA },
      body: JSON.stringify({
        model: "w3g_hires",
        modelrun: baserun,
        lon: BATAM.lon,
        lat: BATAM.lat,
        var: ["hs", "dir"],
      }),
    });
    const pointText = await prRes.text();
    let point: unknown = pointText;
    try {
      point = JSON.parse(pointText);
    } catch {
      /* biarin string */
    }

    return Response.json(
      {
        modelrunRaw: modelrun,
        baserun,
        pointReqStatus: prRes.status,
        pointSample: typeof point === "string" ? point.slice(0, 800) : point,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return Response.json({ error: String(e) }, { headers: { "Cache-Control": "no-store" } });
  }
}
