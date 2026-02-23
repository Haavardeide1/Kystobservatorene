"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";

interface Props {
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function LocationPicker({ onLocationSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let mounted = true;

    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css" as never),
    ]).then(([L]) => {
      if (!mounted || !containerRef.current) return;

      // Fix bundled icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!).setView([63.5, 10.5], 6);

      // CartoDB Voyager — readable labels, neutral colours
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      map.on("click", (e) => {
        if (markerRef.current) map.removeLayer(markerRef.current);
        markerRef.current = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
    });

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className="h-64 w-full overflow-hidden rounded-xl"
    />
  );
}
