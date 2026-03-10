"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/site/SiteHeader";
import type L from "leaflet";

type Submission = {
  id: string;
  media_type: "photo" | "video";
  media_url: string | null;
  created_at: string;
  lat_public: number | null;
  lng_public: number | null;
  comment: string | null;
  valg: string | null;
  wind_dir: string | null;
  wave_dir: string | null;
  researcher_comment: string | null;
  researcher_name: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ShareButton({ sub }: { sub: Submission }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = `Jeg bidro med en ${sub.media_type === "photo" ? "havobservasjon" : "havvideo"} til Kystobservatørene!${sub.comment ? ` "${sub.comment}"` : ""} 🌊`;
    const url = "https://kystobservatorene.no";

    if (navigator.share) {
      try {
        await navigator.share({ title: "Kystobservatørene", text, url });
      } catch {
        // bruker avbrøt
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
    >
      {copied ? "✓ Kopiert!" : "↗ Del"}
    </button>
  );
}

export default function MineObservasjonerPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<Submission | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // ── Auth + fetch ──────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const res = await fetch("/api/profile/submissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setSubmissions(json.data ?? []);
      setLoading(false);
    });
  }, []);

  // ── Map ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (loading || !mapContainerRef.current || mapRef.current) return;
    const withPos = submissions.filter((s) => s.lat_public && s.lng_public);
    if (withPos.length === 0) return;

    let mounted = true;
    (async () => {
      const LLib = await import("leaflet");
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

      const lats = withPos.map((s) => s.lat_public!);
      const lngs = withPos.map((s) => s.lng_public!);
      const bounds = LLib.latLngBounds(
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      );

      const map = LLib.map(mapContainerRef.current).fitBounds(bounds, { padding: [40, 40] });
      LLib.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap © CARTO", subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cluster = (LLib as any).markerClusterGroup({ maxClusterRadius: 50, showCoverageOnHover: false });

      withPos.forEach((sub) => {
        const icon = LLib.divIcon({
          className: "",
          html: `<div style="width:12px;height:12px;border-radius:50%;background:${sub.media_type === "photo" ? "#3b82f6" : "#10b981"};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        LLib.marker([sub.lat_public!, sub.lng_public!], { icon }).addTo(cluster);
      });

      map.addLayer(cluster);
      mapRef.current = map;
    })();

    return () => { mounted = false; };
  }, [loading, submissions]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const photos = submissions.filter((s) => s.media_type === "photo").length;
  const videos = submissions.filter((s) => s.media_type === "video").length;
  const locations = new Set(
    submissions.filter((s) => s.lat_public).map((s) => `${s.lat_public?.toFixed(2)},${s.lng_public?.toFixed(2)}`)
  ).size;
  const withResearcher = submissions.filter((s) => s.researcher_comment).length;

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <SiteHeader variant="light" />

      <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 md:px-6">
        {/* Header */}
        <div className="mb-6">
          <a href="/profil" className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-slate-600">
            ← Tilbake til profil
          </a>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-900">
            Mine observasjoner
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Alle dine bidrag til Kystobservatørene.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white" />)}
          </div>
        ) : submissions.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-2xl">🌊</p>
            <p className="mt-3 font-semibold text-slate-700">Ingen observasjoner ennå</p>
            <a href="/observasjoner" className="mt-4 inline-block rounded-full bg-[#0b1b36] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f2744]">
              Send inn din første
            </a>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Totalt", value: submissions.length, icon: "🌊" },
                { label: "Bilder", value: photos, icon: "📸" },
                { label: "Videoer", value: videos, icon: "🎥" },
                { label: "Steder", value: locations, icon: "📍" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white px-4 py-4 text-center shadow-sm">
                  <div className="text-xl">{s.icon}</div>
                  <div className="mt-1 text-2xl font-black text-slate-800">{s.value}</div>
                  <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Forskerkommentar-banner */}
            {withResearcher > 0 && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4">
                <span className="text-2xl">🔬</span>
                <p className="text-sm text-cyan-800">
                  <span className="font-bold">{withResearcher} av dine observasjoner</span> har fått forskerkommentar fra NORCE!
                </p>
              </div>
            )}

            {/* Kart */}
            {submissions.some((s) => s.lat_public) && (
              <div className="mb-6 overflow-hidden rounded-2xl shadow-sm">
                <div ref={mapContainerRef} className="h-64 w-full md:h-80" />
              </div>
            )}

            {/* Observasjoner */}
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className={`overflow-hidden rounded-2xl bg-white shadow-sm ${sub.researcher_comment ? "ring-2 ring-cyan-300" : ""}`}
                >
                  <div className="flex gap-4 p-4">
                    {/* Thumbnail */}
                    <button
                      className="shrink-0"
                      onClick={() => setLightbox(sub)}
                    >
                      {sub.media_url ? (
                        sub.media_type === "photo" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sub.media_url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                        ) : (
                          <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-slate-800">
                            <video src={sub.media_url} muted preload="metadata" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-lg">▶</div>
                          </div>
                        )
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                          {sub.media_type === "photo" ? "📸" : "🎥"}
                        </div>
                      )}
                    </button>

                    {/* Info */}
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${sub.media_type === "photo" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {sub.media_type === "photo" ? "📸 Bilde" : "🎥 Video"}
                          </span>
                          {sub.researcher_comment && (
                            <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
                              🔬 Forskerkommentar
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{formatDate(sub.created_at)}</p>
                        {sub.comment && (
                          <p className="mt-1 truncate text-sm text-slate-600 italic">&quot;{sub.comment}&quot;</p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <ShareButton sub={sub} />
                        {sub.media_url && (
                          <button
                            onClick={() => setLightbox(sub)}
                            className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            Vis
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Forskerkommentar */}
                  {sub.researcher_comment && (
                    <div className="border-t border-cyan-100 bg-cyan-50 px-4 py-3">
                      <p className="text-xs font-bold text-cyan-700">🔬 {sub.researcher_name}</p>
                      <p className="mt-0.5 text-sm italic text-cyan-900">&quot;{sub.researcher_comment}&quot;</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-h-[90vh] w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} className="absolute -top-10 right-0 text-sm font-semibold text-white/70 hover:text-white">
              Lukk ✕
            </button>
            {lightbox.media_type === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lightbox.media_url!} alt="" className="max-h-[85vh] w-full rounded-2xl object-contain" />
            ) : (
              <video src={lightbox.media_url!} controls autoPlay playsInline className="max-h-[85vh] w-full rounded-2xl bg-black" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
