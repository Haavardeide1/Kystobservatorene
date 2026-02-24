"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtimeSubmissions } from "@/lib/useRealtimeSubmissions";
import type L from "leaflet";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
      : `<video src="${sub.media_url}" controls preload="metadata" playsinline style="width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:10px;display:block;background:#000;"></video>`
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const LRef = useRef<typeof L | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterGroupRef = useRef<any>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const waveLayerRef = useRef<any>(null);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [showWaves, setShowWaves] = useState(false);
  const [waveLoading, setWaveLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────

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

  // ── Realtime ──────────────────────────────────────────────────────────────

  const handleInsert = useCallback(() => {
    setLiveCount((n) => n + 1);
    fetchSubmissions();
  }, [fetchSubmissions]);

  useRealtimeSubmissions(handleInsert);

  // ── Wave layer toggle ─────────────────────────────────────────────────────

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
          // Only the isolines layer — halves data vs loading both layers
          layers: "waveforecast_area_iso_latest",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          opacity: 0.75,
          // 512-px tiles = 4× fewer requests than default 256
          tileSize: 512,
          zoomOffset: -1,
          // Only load tiles when the user stops panning (no wasted mid-pan requests)
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

  // ── Init map ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let mounted = true;

    (async () => {
      const LLib = await import("leaflet");
      // leaflet.markercluster is a UMD plugin that patches window.L — set it first
      (window as any).L = LLib; // eslint-disable-line @typescript-eslint/no-explicit-any
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

      LLib.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Cluster group
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

  // ── Add / update markers ──────────────────────────────────────────────────

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

  // ── Pan to submission ─────────────────────────────────────────────────────

  function panTo(sub: Submission) {
    if (!mapRef.current || !sub.lat_public || !sub.lng_public) return;
    mapRef.current.flyTo([sub.lat_public, sub.lng_public], 13, { duration: 1 });
    // Small delay to let the map zoom in before opening popup
    setTimeout(() => markersRef.current.get(sub.id)?.openPopup(), 1100);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  const total = submissions.length;
  const photos = submissions.filter((s) => s.media_type === "photo").length;
  const videos = submissions.filter((s) => s.media_type === "video").length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
      {/* MAP */}
      <div className="relative flex-1">
        <div ref={mapContainerRef} className="h-full w-full" />

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100">
            <p className="text-sm text-slate-500">Laster observasjoner…</p>
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

        {/* BarentsWatch wave forecast toggle */}
        <button
          type="button"
          onClick={toggleWaves}
          disabled={waveLoading}
          className={`absolute left-[10px] top-[120px] z-[1000] flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-md transition ${
            showWaves
              ? "border-blue-400 bg-blue-600 text-white hover:bg-blue-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
          title="Bølgevarsel fra BarentsWatch"
        >
          {waveLoading ? (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            "🌊"
          )}
          {waveLoading ? "Laster…" : "Bølgevarsel"}
        </button>

        {/* Mobile-only floating CTA — sidebar is hidden on small screens */}
        <a
          href="/observasjoner"
          className="absolute bottom-5 right-4 z-[1000] flex items-center gap-2 rounded-full bg-[#0b1b36] px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:bg-[#0f2744] lg:hidden"
        >
          + Send inn
        </a>

        {liveCount > 0 && (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-600 shadow-md">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            {liveCount} ny{liveCount > 1 ? "e" : ""} siden du åpnet
          </div>
        )}
      </div>

      {/* SIDEBAR */}
      <div className="hidden w-72 flex-col overflow-hidden border-l border-slate-200 bg-white lg:flex">
        {/* Stats */}
        <div className="border-b border-slate-100 p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Observasjoner
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Totalt", value: total },
              { label: "Bilder", value: photos },
              { label: "Videoer", value: videos },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-slate-50 px-2 py-3 text-center">
                <div className="text-xl font-black text-slate-800">{s.value}</div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-5 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
              Bilde
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
              Video
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: "#1d5fa7" }}
              >
                N
              </span>
              Klynge
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              Ingen observasjoner ennå.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {submissions.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => panTo(sub)}
                  disabled={!sub.lat_public || !sub.lng_public}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 disabled:opacity-40"
                >
                  {sub.media_url && sub.media_type === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sub.media_url}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${
                        sub.media_type === "photo" ? "bg-blue-50" : "bg-emerald-50"
                      }`}
                    >
                      {sub.media_type === "photo" ? "📸" : "🎥"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {sub.display_name || "Anonym"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(sub.created_at)}
                      {!sub.lat_public && " · ingen posisjon"}
                    </p>
                  </div>
                  <span
                    className={`ml-auto h-2 w-2 shrink-0 rounded-full ${
                      sub.media_type === "photo" ? "bg-blue-400" : "bg-emerald-400"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-4">
          <a
            href="/observasjoner"
            className="block w-full rounded-xl bg-[#0b1b36] py-3 text-center text-sm font-semibold text-white transition hover:bg-[#0f2744]"
          >
            + Send inn observasjon
          </a>
        </div>
      </div>
    </div>
  );
}
