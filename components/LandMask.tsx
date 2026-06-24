"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.vectorgrid";
import type { ThemeMode } from "@/lib/radar";

// Field OFS (TMS tile) opaque di mana-mana — contourf BMKG bleeding ke daratan tanpa
// land-mask. Solusi (sama kayak app OFS BMKG): gambar polygon DARATAN di pane DI ATAS
// field (laut dibiarin tembus → field keliatan), pakai vector-tile daratan circlegeo.
// Warna fill ~mirip basemap CARTO land biar nyatu pas toggle Hujan/Ombak.
const LAND_FILL: Record<ThemeMode, string> = { light: "#f4f5f2", dark: "#17191e" };

type VG = { vectorGrid: { protobuf: (url: string, opts: object) => L.Layer } };

export default function LandMask({ theme }: { theme: ThemeMode }) {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("landmask")) {
      map.createPane("landmask");
      const pane = map.getPane("landmask");
      if (pane) {
        pane.style.zIndex = "260"; // di ATAS field OFS (tilePane 200), di bawah marker (600)
        pane.style.pointerEvents = "none";
      }
    }
    const layer = (L as unknown as VG).vectorGrid.protobuf(
      "https://tiles.circlegeo.com/data/indocg/{z}/{x}/{y}.pbf",
      {
        pane: "landmask",
        interactive: false,
        maxNativeZoom: 10,
        minZoom: 0,
        maxZoom: 20,
        vectorTileLayerStyles: {
          indocg: {
            fill: true,
            fillColor: LAND_FILL[theme],
            fillOpacity: 1,
            stroke: false,
            weight: 0,
          },
        },
      },
    );
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, theme]);
  return null;
}
