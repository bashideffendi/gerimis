"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CircleMarker,
  ImageOverlay,
  MapContainer,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import {
  DEFAULT_ZOOM,
  LEGEND,
  MAP_CENTER,
  MAX_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
  PLACES,
  RADAR_BOUNDS,
  type Frame,
} from "@/lib/radar";

const REFRESH_MS = 5 * 60 * 1000; // ambil ulang daftar frame tiap 5 menit
const PLAY_MS = 650; // jeda antar frame saat animasi

export default function RadarMap() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [opacity, setOpacity] = useState(0.7);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  // true selama user "ngikut" frame terbaru; jadi false kalau user scrub manual ke frame lama.
  // Pakai ref biar loadFrames (deps kosong) selalu baca nilai terkini tanpa nyentak slider.
  const followRef = useRef(true);

  const loadFrames = useCallback(async () => {
    try {
      const res = await fetch("/api/frames");
      if (!res.ok) throw new Error("bad response");
      const data: { frames: Frame[] } = await res.json();
      if (data.frames?.length) {
        setFrames(data.frames);
        if (followRef.current) setIdx(data.frames.length - 1);
        setStatus("ok");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  // muat awal + auto-refresh
  useEffect(() => {
    loadFrames();
    const t = setInterval(loadFrames, REFRESH_MS);
    return () => clearInterval(t);
  }, [loadFrames]);

  // preload semua frame biar animasi mulus
  useEffect(() => {
    frames.forEach((f) => {
      const img = new window.Image();
      img.src = f.url;
    });
  }, [frames]);

  // animasi play
  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % frames.length);
    }, PLAY_MS);
    return () => clearInterval(t);
  }, [playing, frames.length]);

  const current = frames[idx];
  const isLatest = frames.length > 0 && idx === frames.length - 1;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={MAP_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        maxBounds={MAX_BOUNDS}
        maxBoundsViscosity={0.8}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
          maxZoom={20}
        />

        {current && (
          <ImageOverlay
            url={current.url}
            bounds={RADAR_BOUNDS}
            opacity={opacity}
            zIndex={400}
          />
        )}

        {PLACES.map((p) => (
          <CircleMarker
            key={p.name}
            center={[p.lat, p.lng]}
            radius={4}
            pathOptions={{
              color: "#0f172a",
              weight: 1.5,
              fillColor: "#ffffff",
              fillOpacity: 1,
            }}
          >
            <Tooltip permanent direction="right" offset={[6, 0]} className="place-label">
              {p.name}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Panel kontrol */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex justify-center p-3 sm:p-4">
        <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b1220]/92 p-3 text-white shadow-2xl backdrop-blur-sm sm:p-4">
          {/* Baris waktu */}
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isLatest ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span className="text-sm font-semibold tabular-nums">
                {status === "error"
                  ? "Gagal memuat radar"
                  : current
                    ? `${current.wib} WIB`
                    : "Memuat…"}
              </span>
            </div>
            <span className="text-[11px] text-white/45">
              {isLatest ? "terbaru" : "putar ulang"}
            </span>
          </div>

          {/* Baris play + slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              disabled={frames.length < 2}
              aria-label={playing ? "Jeda" : "Putar"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0b1220] transition hover:bg-white/85 disabled:opacity-40"
            >
              {playing ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <input
              type="range"
              min={0}
              max={Math.max(0, frames.length - 1)}
              value={idx}
              onChange={(e) => {
                const v = Number(e.target.value);
                setPlaying(false);
                setIdx(v);
                followRef.current = v >= frames.length - 1;
              }}
              disabled={frames.length < 2}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-emerald-400"
            />
          </div>

          {/* Baris bawah: opacity + legenda */}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-[11px] text-white/55">
              <span className="shrink-0">Transparansi</span>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/20 accent-sky-400"
              />
            </label>

            <div className="flex items-center gap-1.5">
              {LEGEND.map((l) => (
                <span key={l.label} className="flex items-center gap-1" title={l.label}>
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-[2px]"
                    style={{ backgroundColor: l.color }}
                  />
                </span>
              ))}
              <span className="ml-1 text-[10px] text-white/40">ringan → ekstrem</span>
            </div>
          </div>

          <p className="mt-2.5 text-center text-[10px] leading-tight text-white/35">
            Sumber radar: Meteorological Service Singapore · update tiap 15 menit ·
            posisi overlay = estimasi (kalibrasi area Batam)
          </p>
        </div>
      </div>
    </div>
  );
}
