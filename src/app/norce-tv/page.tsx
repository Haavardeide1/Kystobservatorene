"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

// PIN for tilgang — del denne med NORCE
const TV_PIN = "norce2026";
const GALLERY_COUNT = 10;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutter

const TvMapView = dynamic(() => import("@/components/TvMapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#0a1628]">
      <p className="text-sm text-slate-400">Laster kart…</p>
    </div>
  ),
});

type Submission = {
  id: string;
  media_type: "photo" | "video";
  media_url: string | null;
  thumbnail_url: string | null;
  display_name: string | null;
  place_name: string | null;
  created_at: string;
  comment: string | null;
  valg: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── PIN-gate ──────────────────────────────────────────────────────────────────

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit() {
    if (pin.toLowerCase() === TV_PIN) {
      localStorage.setItem("norce_tv_unlocked", "true");
      onUnlock();
    } else {
      setError(true);
      setPin("");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b2f]">
      <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <div className="mb-8 text-center">
          <Image
            src="/norce-logo.png"
            alt="NORCE"
            width={100}
            height={40}
            className="mx-auto mb-5 h-10 w-auto object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <h1 className="text-lg font-bold text-white">Kystobservatørene</h1>
          <p className="mt-1 text-sm text-white/40">TV-dashboard · Kun for NORCE</p>
        </div>

        <input
          type="password"
          value={pin}
          autoFocus
          onChange={(e) => { setPin(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="PIN-kode"
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-lg tracking-[0.3em] text-white placeholder-white/20 outline-none focus:border-white/40"
        />

        {error && (
          <p className="mt-2 text-center text-sm text-red-400">Feil PIN-kode</p>
        )}

        <button
          onClick={handleSubmit}
          className="mt-4 w-full rounded-xl bg-white py-3 text-sm font-bold text-[#070b2f] transition hover:bg-white/90 active:scale-95"
        >
          Lås opp
        </button>
      </div>
    </div>
  );
}

// ── Galleri-stripe ────────────────────────────────────────────────────────────

function GalleryStrip({ submissions, loading }: { submissions: Submission[]; loading: boolean }) {
  const photoOnly = submissions.filter((s) => s.media_type === "photo" && s.media_url);

  return (
    <div className="flex h-full items-stretch">
      {/* Etikett */}
      <div className="flex w-32 shrink-0 flex-col items-center justify-center border-r border-white/10 px-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">Nyeste</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">bilder</p>
        <p className="mt-2 text-lg font-black text-white/50">{photoOnly.length}</p>
      </div>

      {/* Bilder */}
      {loading ? (
        <div className="flex flex-1 items-center gap-3 overflow-hidden px-4">
          {[...Array(GALLERY_COUNT)].map((_, i) => (
            <div key={i} className="h-36 w-36 shrink-0 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : photoOnly.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-white/30">Ingen bilder ennå</p>
        </div>
      ) : (
        <div className="flex flex-1 items-center gap-3 overflow-x-auto px-4 py-3 scrollbar-none">
          {photoOnly.map((sub, idx) => (
            <div
              key={sub.id}
              className="group relative h-36 w-36 shrink-0 overflow-hidden rounded-xl bg-slate-800 shadow-lg"
              style={{ opacity: 1 - idx * 0.06 }}
            >
              <Image
                src={sub.thumbnail_url ?? sub.media_url!}
                alt={sub.display_name || "Observasjon"}
                fill
                sizes="144px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-2 pb-2 pt-6">
                <p className="truncate text-xs font-semibold text-white">
                  {sub.display_name || "Anonym"}
                </p>
                <p className="text-[10px] text-white/50">{formatDate(sub.created_at)}</p>
              </div>

              {/* Nyeste-badge */}
              {idx === 0 && (
                <div className="absolute left-1.5 top-1.5 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">
                  NY
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Hovedside ─────────────────────────────────────────────────────────────────

export default function NorceTvPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date | null>(null);

  // Sjekk localStorage på mount
  useEffect(() => {
    if (localStorage.getItem("norce_tv_unlocked") === "true") {
      setUnlocked(true);
    }
    setNow(new Date());
  }, []);

  // Klokke
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchGallery = useCallback(async () => {
    try {
      const res = await fetch("/api/submissions/list");
      const { data } = await res.json();
      setSubmissions((data ?? []).slice(0, GALLERY_COUNT));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    fetchGallery();
    const interval = setInterval(fetchGallery, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [unlocked, fetchGallery]);

  if (!unlocked) {
    return <PinGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#070b2f]">
      {/* ── Header ── */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-4">
          <Image
            src="/norce-logo.png"
            alt="NORCE"
            width={70}
            height={28}
            className="h-6 w-auto object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <span className="text-white/20">|</span>
          <span className="text-sm font-semibold tracking-wide text-white/60">
            Kystobservatørene
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Live</span>
          </span>
        </div>

        {/* Klokke */}
        <div className="text-right">
          {now && (
            <>
              <div className="font-mono text-sm font-semibold text-white/70">
                {now.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
              <div className="text-[10px] text-white/30 capitalize">
                {now.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Kart ── */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <TvMapView />
      </div>

      {/* ── Galleri-stripe ── */}
      <div className="h-48 shrink-0 border-t border-white/10 bg-[#0a1628]">
        <GalleryStrip submissions={submissions} loading={loading} />
      </div>
    </div>
  );
}
