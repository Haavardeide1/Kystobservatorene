"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";

type Submission = {
  id: string;
  media_type: "photo" | "video";
  lat_public: number | null;
  lng_public: number | null;
  display_name: string | null;
  created_at: string;
};

function makeMarkerIcon(LLib: typeof L, type: "photo" | "video") {
  const bg = type === "photo" ? "#3b82f6" : "#10b981";
  const emoji = type === "photo" ? "📸" : "🎥";
  return LLib.divIcon({
    className: "",
    html: `<div style="width:34px;height:34px;border-radius:50%;background:${bg};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;">${emoji}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeClusterIcon(LLib: typeof L, cluster: any) {
  const count: number = cluster.getChildCount();
  const size = count < 10 ? 32 : 38;
  return LLib.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:#1d5fa7;color:#fff;font-weight:700;font-size:13px;
      display:flex;align-items:center;justify-content:center;
      border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);
      font-family:system-ui;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function HomeMiniMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const LRef = useRef<typeof L | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterRef = useRef<any>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Fetch submissions
  useEffect(() => {
    fetch("/api/submissions/list")
      .then((r) => r.json())
      .then(({ data }) => {
        setSubmissions(data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let mounted = true;

    (async () => {
      const LLib = await import("leaflet");
      // leaflet.markercluster is a UMD plugin that patches window.L — set it first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).L = LLib;
      await Promise.all([
        import("leaflet/dist/leaflet.css" as never),
        import("leaflet.markercluster"),
        import("leaflet.markercluster/dist/MarkerCluster.css" as never),
        import("leaflet.markercluster/dist/MarkerCluster.Default.css" as never),
      ]);

      if (!mounted || !containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (LLib.Icon.Default.prototype as any)._getIconUrl;
      LLib.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = LLib.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
        maxBounds: [[55, 1], [72, 34]],
        maxBoundsViscosity: 0.8,
      }).setView([65, 15], 4);

      // Satellite base layer
      LLib.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      ).addTo(map);

      // Subtle label overlay on top of satellite
      LLib.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19, opacity: 0.7 }
      ).addTo(map);

      // Norway border — glowing blue outline
      try {
        const res = await fetch(
          "https://raw.githubusercontent.com/johan/world.geo.json/master/countries/NOR.geo.json"
        );
        const norwayData = await res.json();

        // Subtle fill
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (LLib as any).geoJSON(norwayData, {
          style: {
            fillColor: "#3b82f6",
            fillOpacity: 0.07,
            color: "transparent",
            weight: 0,
          },
        }).addTo(map);

        // Glowing border
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (LLib as any).geoJSON(norwayData, {
          style: {
            fillOpacity: 0,
            color: "#60a5fa",
            weight: 2,
            opacity: 0.85,
          },
        }).addTo(map);
      } catch {
        // silently fail — map still works without border
      }

      // Marker cluster group
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clusterGroup = (LLib as any).markerClusterGroup({
        maxClusterRadius: 60,
        showCoverageOnHover: false,
        iconCreateFunction: (cluster: unknown) => makeClusterIcon(LLib, cluster),
      });
      map.addLayer(clusterGroup);

      LRef.current = LLib;
      mapRef.current = map;
      clusterRef.current = clusterGroup;
      setMapReady(true);
    })();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current.clear();
        LRef.current = null;
        clusterRef.current = null;
      }
    };
  }, []);

  // Add markers
  useEffect(() => {
    if (!mapReady || !LRef.current || !clusterRef.current) return;
    const LLib = LRef.current;
    const clusterGroup = clusterRef.current;

    submissions.forEach((sub) => {
      if (!sub.lat_public || !sub.lng_public) return;
      if (markersRef.current.has(sub.id)) return;

      const icon = makeMarkerIcon(LLib, sub.media_type);
      const marker = LLib.marker([sub.lat_public, sub.lng_public], { icon });
      clusterGroup.addLayer(marker);
      markersRef.current.set(sub.id, marker);
    });
  }, [mapReady, submissions]);

  const total = submissions.length;
  const photos = submissions.filter((s) => s.media_type === "photo").length;
  const videos = submissions.filter((s) => s.media_type === "video").length;

  return (
    <div>
      {/* Stats row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            Kystobservasjoner
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Kart og statistikk
          </h3>
        </div>
        <div className="flex gap-2 md:gap-3">
          {[
            { label: "Totalt", value: loading ? "…" : total },
            { label: "Bilder", value: loading ? "…" : photos },
            { label: "Videoer", value: loading ? "…" : videos },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center text-white backdrop-blur-sm md:px-6 md:py-4"
            >
              <div className="text-lg font-semibold md:text-xl">{s.value}</div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/60 md:text-xs md:tracking-[0.2em]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div
        className="relative mt-6 h-[320px] overflow-hidden rounded-3xl border border-white/10 md:mt-8 md:h-[500px]"
        style={{ boxShadow: "0 0 60px rgba(59,130,246,0.18), 0 4px 40px rgba(0,0,0,0.5)" }}
      >
        <div ref={containerRef} className="h-full w-full" />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#070b2f]">
            <p className="text-sm text-white/40">Laster kart…</p>
          </div>
        )}

        {/* Reset view button */}
        <button
          type="button"
          onClick={() =>
            mapRef.current?.setView([65, 15], 4, { animate: true })
          }
          className="absolute left-[10px] top-[80px] z-[1000] flex items-center gap-1.5 rounded-lg border border-white/20 bg-[#0b1438]/90 px-3 py-1.5 text-xs font-semibold text-white/80 shadow-md backdrop-blur-sm transition hover:bg-white/10"
          title="Zoom ut til oversikt"
        >
          ↩ Hele Norge
        </button>

        {/* Bottom gradient + CTA */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#070b2f]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <a
            href="/kart"
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#0b1b36] shadow-lg transition hover:bg-slate-50 hover:shadow-xl"
          >
            Se fullt kart
            <span className="text-[#1d5fa7]">→</span>
          </a>
        </div>

        {/* FORKLARING legend */}
        <div className="absolute right-4 top-4 rounded-xl border border-white/15 bg-[#0b1438]/80 px-4 py-3 shadow-lg backdrop-blur-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-white/60">
            Forklaring
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#3b82f6", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                📸
              </div>
              <span className="text-sm text-white/80">Bilde</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#10b981", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                🎥
              </div>
              <span className="text-sm text-white/80">Video</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
