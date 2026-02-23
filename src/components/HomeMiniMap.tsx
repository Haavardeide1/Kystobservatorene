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
    html: `<div style="width:34px;height:34px;border-radius:50%;background:${bg};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;">${emoji}</div>`,
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
      border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.2);
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

  // Fetch
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
      }).setView([63.5, 10.5], 5);

      LLib.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

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
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Kystobservasjoner
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[#1d5fa7]">
            Kart og statistikk
          </h3>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Totalt", value: loading ? "…" : total },
            { label: "Bilder", value: loading ? "…" : photos },
            { label: "Videoer", value: loading ? "…" : videos },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-[#2c7dc6] px-6 py-4 text-center text-white shadow-sm"
            >
              <div className="text-xl font-semibold">{s.value}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/80">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map + CTA */}
      <div className="relative mt-8 h-[480px] overflow-hidden rounded-3xl border border-slate-200 shadow-inner">
        {/* Map */}
        <div ref={containerRef} className="h-full w-full" />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <p className="text-sm text-slate-400">Laster kart…</p>
          </div>
        )}

        {/* Reset view button — below the Leaflet zoom control */}
        <button
          type="button"
          onClick={() =>
            mapRef.current?.setView([63.5, 10.5], 5, { animate: true })
          }
          className="absolute left-[10px] top-[80px] z-[1000] flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md transition hover:bg-slate-50"
          title="Zoom ut til oversikt"
        >
          ↩ Hele Norge
        </button>

        {/* Gradient + CTA at bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <a
            href="/kart"
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#0b1b36] shadow-lg transition hover:bg-slate-50 hover:shadow-xl"
          >
            Se fullt kart
            <span className="text-[#1d5fa7]">→</span>
          </a>
        </div>

        {/* FORKLARING legend top-right */}
        <div className="absolute right-4 top-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-700">
            Forklaring
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#3b82f6", border: "2px solid #fff", boxShadow: "0 1px 5px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                📸
              </div>
              <span className="text-sm text-slate-700">Bilde</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#10b981", border: "2px solid #fff", boxShadow: "0 1px 5px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                🎥
              </div>
              <span className="text-sm text-slate-700">Video</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
