"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";

type Submission = {
  id: string;
  media_type: "photo" | "video";
  media_url: string | null;
  lat_public: number | null;
  lng_public: number | null;
  display_name: string | null;
  created_at: string;
};

function makeMarkerIcon(LLib: typeof L, type: "photo" | "video") {
  const color = type === "photo" ? "#3b82f6" : "#10b981";
  return LLib.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

function buildPopupHtml(sub: Submission): string {
  const date = new Date(sub.created_at).toLocaleDateString("nb-NO", {
    day: "numeric", month: "short", year: "numeric",
  });
  const name = sub.display_name || "Anonym";
  const typeLabel = sub.media_type === "photo" ? "Bilde" : "Video";

  const mediaHtml = sub.media_url
    ? sub.media_type === "photo"
      ? `<img src="${sub.media_url}" style="width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:10px;display:block;">`
      : `<video src="${sub.media_url}" controls preload="metadata" playsinline style="width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:10px;display:block;background:#000;"></video>`
    : `<div style="width:100%;height:80px;border-radius:10px;background:#f1f5f9;margin-bottom:10px;display:flex;align-items:center;justify-content:center;font-size:28px;">${sub.media_type === "photo" ? "📸" : "🎥"}</div>`;

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-width:220px;max-width:260px;">
      ${mediaHtml}
      <div style="font-weight:700;font-size:14px;color:#0f172a;margin-bottom:2px;">${name}</div>
      <div style="font-size:12px;color:#94a3b8;">${date} · ${typeLabel}</div>
    </div>
  `;
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
      }).setView([65, 15], 4);

      // Same tile layer as kart-siden (CartoDB Voyager)
      LLib.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

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
      marker.bindPopup(buildPopupHtml(sub), { maxWidth: 280 });
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
          className="absolute left-[10px] top-[80px] z-[1000] flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-sm transition hover:bg-slate-50"
          title="Zoom ut til oversikt"
        >
          ↩ Hele Norge
        </button>

        {/* Bottom CTA */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <a
            href="/kart"
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#0b1b36] shadow-lg transition hover:bg-slate-50 hover:shadow-xl"
          >
            Se fullt kart
            <span className="text-[#1d5fa7]">→</span>
          </a>
        </div>

        {/* Legend */}
        <div className="absolute right-4 top-4 rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-md backdrop-blur-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
            Forklaring
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#3b82f6", border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
              <span className="text-xs text-slate-600">Bilde</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#10b981", border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
              <span className="text-xs text-slate-600">Video</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
