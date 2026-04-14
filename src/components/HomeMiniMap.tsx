"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import { getLevelInfo, XP_PER_SUBMISSION } from "@/lib/levels";

type Submission = {
  id: string;
  user_id: string | null;
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

function buildPopupHtml(sub: Submission, levelTitle?: string, levelColor?: string): string {
  const date = new Date(sub.created_at).toLocaleDateString("nb-NO", {
    day: "numeric", month: "short", year: "numeric",
  });
  const name = sub.display_name || "Anonym";
  const typeLabel = sub.media_type === "photo" ? "Bilde" : "Video";

  const mediaHtml = sub.media_url
    ? sub.media_type === "photo"
      ? `<img src="${sub.media_url}" style="width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:10px;display:block;">`
      : `<video controls preload="metadata" playsinline style="width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:10px;display:block;background:#000;"><source src="${sub.media_url}" type="video/mp4"><source src="${sub.media_url}" type="video/quicktime"><source src="${sub.media_url}" type="video/webm"></video>`
    : `<div style="width:100%;height:80px;border-radius:10px;background:#f1f5f9;margin-bottom:10px;display:flex;align-items:center;justify-content:center;font-size:28px;">${sub.media_type === "photo" ? "📸" : "🎥"}</div>`;

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-width:220px;max-width:260px;">
      ${mediaHtml}
      <div style="font-weight:700;font-size:14px;color:#0f172a;margin-bottom:2px;">${name}${levelTitle ? ` <span style="font-size:11px;font-weight:600;color:${levelColor ?? "#64748b"};">${levelTitle}</span>` : ""}</div>
      <div style="font-size:12px;color:#94a3b8;">${date} · ${typeLabel}</div>
      <button data-lightbox-id="${sub.id}" style="margin-top:10px;width:100%;padding:7px 0;background:#0b1b36;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">🔍 Vis stort</button>
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
  const [lightboxSub, setLightboxSub] = useState<Submission | null>(null);

  // Lightbox – event delegation for popup-knapper
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const btn = (e.target as HTMLElement).closest("[data-lightbox-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-lightbox-id");
      if (!id) return;
      const sub = submissions.find((s) => s.id === id);
      if (sub) setLightboxSub(sub);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [submissions]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxSub(null);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

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

    // Build total submission count per user for level calculation
    const totalCounts = new Map<string, number>();
    submissions.forEach((s) => {
      if (s.user_id) totalCounts.set(s.user_id, (totalCounts.get(s.user_id) ?? 0) + 1);
    });

    submissions.forEach((sub) => {
      if (!sub.lat_public || !sub.lng_public) return;
      if (markersRef.current.has(sub.id)) return;

      let levelTitle: string | undefined;
      let levelColor: string | undefined;
      if (sub.user_id) {
        const xp = (totalCounts.get(sub.user_id) ?? 0) * XP_PER_SUBMISSION;
        const { current } = getLevelInfo(xp);
        levelTitle = `· Nivå ${current.level} ${current.title}`;
        levelColor = current.color;
      }

      const icon = makeMarkerIcon(LLib, sub.media_type);
      const marker = LLib.marker([sub.lat_public, sub.lng_public], { icon });
      marker.bindPopup(buildPopupHtml(sub, levelTitle, levelColor), { maxWidth: 280 });
      clusterGroup.addLayer(marker);
      markersRef.current.set(sub.id, marker);
    });
  }, [mapReady, submissions]);

  const total = submissions.length;
  const photos = submissions.filter((s) => s.media_type === "photo").length;
  const videos = submissions.filter((s) => s.media_type === "video").length;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("nb-NO", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  return (
    <>
    {/* Lightbox modal */}
    {lightboxSub && (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
        onClick={() => setLightboxSub(null)}
      >
        <div
          className="relative max-h-[92vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setLightboxSub(null)}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Lukk"
          >
            ✕
          </button>

          {lightboxSub.media_url ? (
            lightboxSub.media_type === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightboxSub.media_url}
                alt=""
                className="w-full rounded-t-2xl object-contain"
                style={{ maxHeight: "70vh" }}
              />
            ) : (
              <video
                controls
                autoPlay
                playsInline
                className="w-full rounded-t-2xl"
                style={{ maxHeight: "70vh", background: "#000" }}
              >
                <source src={lightboxSub.media_url} type="video/mp4" />
                <source src={lightboxSub.media_url} type="video/quicktime" />
                <source src={lightboxSub.media_url} type="video/webm" />
              </video>
            )
          ) : (
            <div className="flex h-48 w-full items-center justify-center rounded-t-2xl bg-slate-100 text-5xl">
              {lightboxSub.media_type === "photo" ? "📸" : "🎥"}
            </div>
          )}

          <div className="p-5">
            <p className="font-bold text-slate-800">{lightboxSub.display_name || "Anonym"}</p>
            <p className="text-sm text-slate-400">
              {formatDate(lightboxSub.created_at)} · {lightboxSub.media_type === "photo" ? "Bilde" : "Video"}
            </p>
          </div>
        </div>
      </div>
    )}

    <div>
      {/* Stats row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            Kystobservasjoner
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Observasjonskart
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
            href="/observasjonskart"
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
    </>
  );
}
