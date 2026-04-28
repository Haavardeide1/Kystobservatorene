"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtimeSubmissions } from "@/lib/useRealtimeSubmissions";
import type L from "leaflet";

type Submission = {
  id: string;
  media_type: "photo" | "video";
  lat_public: number | null;
  lng_public: number | null;
  display_name: string | null;
  comment: string | null;
  valg: string | null;
  wind_dir: string | null;
  wave_dir: string | null;
  created_at: string;
  media_url: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildPopupHtml(sub: Submission): string {
  const date = formatDate(sub.created_at);
  const name = sub.display_name || "Anonym";
  const typeLabel = sub.media_type === "photo" ? "Bilde" : "Video";

  const mediaHtml = sub.media_url
    ? sub.media_type === "photo"
      ? `<img src="${sub.media_url}" style="width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:10px;display:block;">`
      : `<video controls preload="metadata" playsinline style="width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:10px;display:block;background:#000;"><source src="${sub.media_url}" type="video/mp4"><source src="${sub.media_url}" type="video/quicktime"><source src="${sub.media_url}" type="video/webm"></video>`
    : `<div style="width:100%;height:80px;border-radius:10px;background:#f1f5f9;margin-bottom:10px;display:flex;align-items:center;justify-content:center;font-size:28px;">${sub.media_type === "photo" ? "📸" : "🎥"}</div>`;

  const meta = [
    sub.valg && `<span style="background:#f1f5f9;padding:2px 8px;border-radius:20px;">${sub.valg}</span>`,
    sub.wind_dir && `<span style="background:#f1f5f9;padding:2px 8px;border-radius:20px;">💨 ${sub.wind_dir}</span>`,
    sub.wave_dir && `<span style="background:#f1f5f9;padding:2px 8px;border-radius:20px;">🌊 ${sub.wave_dir}</span>`,
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-width:220px;max-width:260px;">
      ${mediaHtml}
      <div style="font-weight:700;font-size:14px;color:#0f172a;margin-bottom:2px;">${name}</div>
      <div style="font-size:12px;color:#94a3b8;margin-bottom:${meta ? "8px" : "0"};">${date} · ${typeLabel}</div>
      ${meta ? `<div style="display:flex;flex-wrap:wrap;gap:4px;font-size:11px;color:#475569;">${meta}</div>` : ""}
      ${sub.comment ? `<div style="font-size:12px;color:#475569;margin-top:8px;font-style:italic;">"${sub.comment}"</div>` : ""}
    </div>
  `;
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeClusterIcon(LLib: typeof L, cluster: any) {
  const count: number = cluster.getChildCount();
  const size = count < 10 ? 36 : count < 100 ? 42 : 48;
  return LLib.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:#1d5fa7;color:#fff;font-weight:700;
      font-size:${count < 100 ? 14 : 12}px;
      display:flex;align-items:center;justify-content:center;
      border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.25);
      font-family:system-ui;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function TvMapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const LRef = useRef<typeof L | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterGroupRef = useRef<any>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const waveLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const satelliteLayerRef = useRef<any>(null);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [showWaves, setShowWaves] = useState(false);
  const [waveLoading, setWaveLoading] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch("/api/submissions/list");
      const json = await res.json();
      setSubmissions(json.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleInsert = useCallback(() => {
    setLiveCount((n) => n + 1);
    fetchSubmissions();
  }, [fetchSubmissions]);

  useRealtimeSubmissions(handleInsert);

  function toggleWaves() {
    if (!mapRef.current || !LRef.current) return;
    const LLib = LRef.current;
    const map = mapRef.current;

    if (waveLayerRef.current) {
      map.removeLayer(waveLayerRef.current);
      waveLayerRef.current = null;
      setShowWaves(false);
      setWaveLoading(false);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wmsLayer = (LLib as any).tileLayer.wms(
        "https://geo.barentswatch.no/geoserver/bw/ows",
        {
          layers: "waveforecast_area_iso_latest",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          opacity: 0.75,
          tileSize: 512,
          zoomOffset: -1,
          updateWhenIdle: true,
        }
      );
      setWaveLoading(true);
      wmsLayer.on("load", () => setWaveLoading(false));
      wmsLayer.on("error", () => setWaveLoading(false));
      wmsLayer.addTo(map);
      waveLayerRef.current = wmsLayer;
      setShowWaves(true);
    }
  }

  function toggleSatellite() {
    if (!mapRef.current || !baseLayerRef.current || !satelliteLayerRef.current) return;
    const map = mapRef.current;
    if (showSatellite) {
      map.removeLayer(satelliteLayerRef.current);
      baseLayerRef.current.addTo(map);
      setShowSatellite(false);
    } else {
      map.removeLayer(baseLayerRef.current);
      satelliteLayerRef.current.addTo(map);
      setShowSatellite(true);
    }
    if (waveLayerRef.current) {
      waveLayerRef.current.bringToFront();
    }
  }

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let mounted = true;

    (async () => {
      const LLib = await import("leaflet");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).L = LLib;
      await Promise.all([
        import("leaflet/dist/leaflet.css" as never),
        import("leaflet.markercluster"),
        import("leaflet.markercluster/dist/MarkerCluster.css" as never),
        import("leaflet.markercluster/dist/MarkerCluster.Default.css" as never),
      ]);

      if (!mounted || !mapContainerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (LLib.Icon.Default.prototype as any)._getIconUrl;
      LLib.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = LLib.map(mapContainerRef.current).setView([63.5, 10.5], 5);

      const baseLayer = LLib.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      );
      baseLayer.addTo(map);
      baseLayerRef.current = baseLayer;

      satelliteLayerRef.current = LLib.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri",
          maxZoom: 19,
        }
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clusterGroup = (LLib as any).markerClusterGroup({
        maxClusterRadius: 60,
        showCoverageOnHover: false,
        iconCreateFunction: (cluster: unknown) => makeClusterIcon(LLib, cluster),
      });
      map.addLayer(clusterGroup);

      LRef.current = LLib;
      mapRef.current = map;
      clusterGroupRef.current = clusterGroup;
      setMapReady(true);
    })();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current.clear();
        LRef.current = null;
        clusterGroupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !LRef.current || !clusterGroupRef.current) return;
    const LLib = LRef.current;
    const clusterGroup = clusterGroupRef.current;

    submissions.forEach((sub) => {
      if (!sub.lat_public || !sub.lng_public) return;

      if (markersRef.current.has(sub.id)) {
        markersRef.current.get(sub.id)?.setPopupContent(buildPopupHtml(sub));
        return;
      }

      const icon = makeMarkerIcon(LLib, sub.media_type);
      const marker = LLib.marker([sub.lat_public, sub.lng_public], { icon })
        .bindPopup(buildPopupHtml(sub), { maxWidth: 280 });

      clusterGroup.addLayer(marker);
      markersRef.current.set(sub.id, marker);
    });
  }, [mapReady, submissions]);

  const total = submissions.length;
  const photos = submissions.filter((s) => s.media_type === "photo").length;
  const videos = submissions.filter((s) => s.media_type === "video").length;

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />

      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a1628]">
          <p className="text-sm text-slate-400">Laster observasjoner…</p>
        </div>
      )}

      {/* Statistikk-badge */}
      {!loading && (
        <div className="absolute left-[10px] top-[10px] z-[1000] flex items-center gap-3 rounded-xl border border-white/20 bg-[#070b2f]/90 px-4 py-2 backdrop-blur-sm">
          <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Observasjoner</span>
          <span className="text-sm font-black text-white">{total}</span>
          <span className="text-white/20">·</span>
          <span className="flex items-center gap-1 text-xs text-blue-400">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            {photos} bilder
          </span>
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {videos} videoer
          </span>
        </div>
      )}

      {/* Tilbakestill visning */}
      <button
        type="button"
        onClick={() => mapRef.current?.setView([63.5, 10.5], 5, { animate: true })}
        className="absolute left-[10px] top-[70px] z-[1000] flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md transition hover:bg-slate-50"
        title="Zoom ut til oversikt"
      >
        ↩ Hele Norge
      </button>

      {/* Bølgevarsel */}
      <button
        type="button"
        onClick={toggleWaves}
        disabled={waveLoading}
        className={`absolute left-[10px] top-[110px] z-[1000] flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-md transition ${
          showWaves
            ? "border-blue-400 bg-blue-600 text-white hover:bg-blue-700"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        {waveLoading ? (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : "🌊"}
        {waveLoading ? "Laster…" : "Bølgevarsel"}
      </button>

      {/* Satellitt */}
      <button
        type="button"
        onClick={toggleSatellite}
        className={`absolute left-[10px] top-[150px] z-[1000] flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-md transition ${
          showSatellite
            ? "border-amber-400 bg-amber-500 text-white hover:bg-amber-600"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        🛰 Satellitt
      </button>

      {/* Live-indikator ved nye observasjoner */}
      {liveCount > 0 && (
        <div className="absolute right-4 top-3 z-[1000] flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-600 shadow-md">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          {liveCount} ny{liveCount > 1 ? "e" : ""} siden oppstart
        </div>
      )}
    </div>
  );
}
