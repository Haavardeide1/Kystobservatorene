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

// ── Tile helpers ──────────────────────────────────────────────────────────────

function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

function tilePixelOffset(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const tx = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const ty =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { px: (tx - Math.floor(tx)) * 256, py: (ty - Math.floor(ty)) * 256 };
}

async function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function load3x3Map(lat: number, lng: number, zoom: number): Promise<{ canvas: HTMLCanvasElement; pinX: number; pinY: number } | null> {
  const TILE = 256;
  const { x: cx, y: cy } = latLngToTile(lat, lng, zoom);
  const { px, py } = tilePixelOffset(lat, lng, zoom);

  const offscreen = document.createElement("canvas");
  offscreen.width = TILE * 3;
  offscreen.height = TILE * 3;
  const octx = offscreen.getContext("2d")!;

  const loads: Promise<void>[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = cx + dx, ty = cy + dy;
      const url = `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tx}/${ty}.png`;
      loads.push(
        loadImage(url, true).then((img) => {
          if (img) octx.drawImage(img, (dx + 1) * TILE, (dy + 1) * TILE, TILE, TILE);
        })
      );
    }
  }
  await Promise.all(loads);

  // Pin is at center tile offset + 1 tile (for the 3x3 grid offset)
  const pinX = TILE + px;
  const pinY = TILE + py;

  return { canvas: offscreen, pinX, pinY };
}

async function generateShareCard(sub: Submission): Promise<Blob | null> {
  const W = 1080, H = 1350;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── 1. Full-bleed foto ──────────────────────────────────────────────────────
  if (sub.media_url && sub.media_type === "photo") {
    const img = await loadImage(sub.media_url, true);
    if (img) {
      const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale;
      ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
    } else {
      drawOceanBg(ctx, W, H);
    }
  } else {
    drawOceanBg(ctx, W, H);
  }

  // ── 2. Gradients for text readability ───────────────────────────────────────
  // Top gradient (logo)
  const gTop = ctx.createLinearGradient(0, 0, 0, H * 0.32);
  gTop.addColorStop(0, "rgba(4,8,30,0.82)");
  gTop.addColorStop(1, "rgba(4,8,30,0)");
  ctx.fillStyle = gTop;
  ctx.fillRect(0, 0, W, H);

  // Bottom gradient (info + map)
  const gBot = ctx.createLinearGradient(0, H * 0.52, 0, H);
  gBot.addColorStop(0, "rgba(4,8,30,0)");
  gBot.addColorStop(0.45, "rgba(4,8,30,0.78)");
  gBot.addColorStop(1, "rgba(4,8,30,0.97)");
  ctx.fillStyle = gBot;
  ctx.fillRect(0, 0, W, H);

  // ── 3. Logo øverst ──────────────────────────────────────────────────────────
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 18;
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 52px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("KYSTOBSERVATØRENE", 72, 100);
  ctx.shadowBlur = 0;

  // NORCE-logo under tittel
  const norceLogo = await loadImage("/norce-logo.png");
  if (norceLogo) {
    const logoH = 44;
    const logoW = Math.round((norceLogo.naturalWidth / norceLogo.naturalHeight) * logoH);
    ctx.globalAlpha = 0.85;
    ctx.drawImage(norceLogo, 72, 116, logoW, logoH);
    ctx.globalAlpha = 1;
  }

  // ── 4. Dato + info (nede til venstre) ───────────────────────────────────────
  const date = new Date(sub.created_at);
  const dateStr = date.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = date.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });

  const textX = 72;
  const textBase = H - 72;

  // Watermark
  ctx.textAlign = "left";
  ctx.font = "400 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillText("kystobservatorene.no", textX, textBase);

  // Koordinater
  if (sub.lat_public && sub.lng_public) {
    ctx.font = "400 28px 'Courier New', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(
      `${sub.lat_public.toFixed(4)}° N  ${sub.lng_public.toFixed(4)}° Ø`,
      textX, textBase - 48
    );
  }

  // Klokkeslett
  ctx.font = "400 38px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(`kl. ${timeStr}`, textX, textBase - 108);

  // Dato (stor) med shadow
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 14;
  ctx.font = "800 68px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(dateStr, textX, textBase - 166);
  ctx.shadowBlur = 0;

  // ── 5. Kart (nede til høyre) ─────────────────────────────────────────────────
  if (sub.lat_public && sub.lng_public) {
    const MAP_SIZE = 300;
    const mx = W - 72 - MAP_SIZE;
    const my = H - 72 - MAP_SIZE;

    const mapResult = await load3x3Map(sub.lat_public, sub.lng_public, 11);

    ctx.save();
    roundRect(ctx, mx, my, MAP_SIZE, MAP_SIZE, 20);
    ctx.clip();

    if (mapResult) {
      const src = mapResult.canvas;
      // Scale so each tile = MAP_SIZE, ensuring the box is always fully covered
      const TILE = 256;
      const scale = MAP_SIZE / TILE;
      const destPinX = mx + MAP_SIZE / 2;
      const destPinY = my + MAP_SIZE / 2;
      const offsetX = destPinX - mapResult.pinX * scale;
      const offsetY = destPinY - mapResult.pinY * scale;
      ctx.drawImage(src, offsetX, offsetY, src.width * scale, src.height * scale);
    } else {
      ctx.fillStyle = "#dde8f4";
      ctx.fillRect(mx, my, MAP_SIZE, MAP_SIZE);
    }
    ctx.restore();

    // Border
    roundRect(ctx, mx, my, MAP_SIZE, MAP_SIZE, 20);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Pin glow
    const pinX = mx + MAP_SIZE / 2;
    const pinY = my + MAP_SIZE / 2;
    const glowGrad = ctx.createRadialGradient(pinX, pinY, 6, pinX, pinY, 28);
    glowGrad.addColorStop(0, "rgba(249,115,22,0.65)");
    glowGrad.addColorStop(1, "rgba(249,115,22,0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(pinX, pinY, 28, 0, Math.PI * 2);
    ctx.fill();

    // Pin dot
    ctx.beginPath();
    ctx.arc(pinX, pinY, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#f97316";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pinX, pinY, 10, 0, Math.PI * 2);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

function drawOceanBg(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w * 0.3, h);
  g.addColorStop(0, "#070b2f");
  g.addColorStop(0.5, "#0a2a5e");
  g.addColorStop(1, "#04111f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// ── ShareCardButton ────────────────────────────────────────────────────────────

function ShareCardButton({ sub }: { sub: Submission }) {
  const [shareState, setShareState] = useState<"idle" | "generating" | "done">("idle");
  const [dlState, setDlState] = useState<"idle" | "generating" | "done">("idle");

  async function handleShare() {
    setShareState("generating");
    try {
      const blob = await generateShareCard(sub);
      if (!blob) { setShareState("idle"); return; }
      const file = new File([blob], "kystobservasjon.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Kystobservatørene", text: "Jeg har bidratt til havforskning langs kysten! 🌊" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "kystobservasjon.png"; a.click();
        URL.revokeObjectURL(url);
      }
      setShareState("idle");
    } catch { setShareState("idle"); }
  }

  async function handleDownload() {
    setDlState("generating");
    try {
      const blob = await generateShareCard(sub);
      if (!blob) { setDlState("idle"); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "kystobservasjon.png"; a.click();
      URL.revokeObjectURL(url);
      setDlState("done");
      setTimeout(() => setDlState("idle"), 2500);
    } catch { setDlState("idle"); }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleShare}
        disabled={shareState === "generating"}
        className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-60"
      >
        {shareState === "generating" ? (
          <><span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" /> Lager…</>
        ) : "↗ Del kort"}
      </button>
      <button
        onClick={handleDownload}
        disabled={dlState === "generating"}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
      >
        {dlState === "generating" ? (
          <><span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" /> Lager…</>
        ) : dlState === "done" ? "✓ Lastet ned!" : "↓ Last ned"}
      </button>
    </div>
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
            <a href="/sendinn" className="mt-4 inline-block rounded-full bg-[#0b1b36] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f2744]">
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
                        <ShareCardButton sub={sub} />
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
