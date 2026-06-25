import type { MetadataRoute } from "next";

// PWA: manifest buat "Add to Home Screen" + ikon. SW minimal ADA (public/sw.js,
// didaftar via ServiceWorkerRegister): data real-time = network-only ANTI-BASI,
// shell statis content-hashed = cache-first.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hujan di Batam — Radar Hujan Real-time",
    short_name: "Hujan di Batam",
    description:
      "Radar hujan real-time Batam & sekitarnya. Sumber: Meteorological Service Singapore.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c0d10",
    theme_color: "#0c0d10",
    lang: "id",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
