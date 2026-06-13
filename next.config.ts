import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Radar PNG di-overlay langsung lewat <img> (Leaflet ImageOverlay), bukan next/image,
  // jadi nggak perlu remotePatterns. Build dibiarkan strict.
};

export default nextConfig;
