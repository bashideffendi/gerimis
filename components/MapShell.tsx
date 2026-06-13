"use client";

import dynamic from "next/dynamic";

// Leaflet butuh `window`, jadi map-nya client-only (nggak di-SSR).
const RadarMap = dynamic(() => import("./RadarMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0b1220] text-sm text-white/50">
      Memuat peta…
    </div>
  ),
});

export default function MapShell() {
  return <RadarMap />;
}
