"use client";

import { useEffect, useState } from "react";
import SiteHeader from "@/components/site/SiteHeader";

type Submission = {
  id: string;
  media_type: "photo" | "video";
  media_url: string | null;
  display_name: string | null;
  lat_public: number | null;
  lng_public: number | null;
  created_at: string;
};

// Module-level cache so repeated renders don't re-fetch the same coordinates
const geocodeCache = new Map<string, string>();

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "nb" } }
    );
    const data = await res.json();
    const a = data.address ?? {};
    const place =
      a.city || a.town || a.village || a.municipality || a.county || "Ukjent sted";
    geocodeCache.set(key, place);
    return place;
  } catch {
    return "Ukjent sted";
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function GalleryCard({ sub }: { sub: Submission }) {
  const [place, setPlace] = useState<string | null>(null);

  useEffect(() => {
    if (sub.lat_public && sub.lng_public) {
      reverseGeocode(sub.lat_public, sub.lng_public).then(setPlace);
    }
  }, [sub.lat_public, sub.lng_public]);

  if (!sub.media_url) return null;

  return (
    <div className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100 shadow-md">
      {sub.media_type === "photo" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sub.media_url}
          alt={sub.display_name || "Observasjon"}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        <>
          <video
            src={sub.media_url}
            className="h-full w-full object-cover"
            preload="metadata"
            playsInline
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <span className="text-xl">▶</span>
            </div>
          </div>
        </>
      )}

      {/* Bottom overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4 pt-10">
        <p className="truncate text-sm font-semibold text-white">
          {sub.display_name || "Anonym"}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/70">
          {place ? (
            <>
              <span>📍</span>
              <span className="truncate">{place}</span>
            </>
          ) : sub.lat_public ? (
            <span className="animate-pulse">Henter sted…</span>
          ) : null}
        </div>
        <p className="mt-1 text-[10px] text-white/40">{formatDate(sub.created_at)}</p>
      </div>
    </div>
  );
}

export default function GalleriPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/submissions/list")
      .then((r) => r.json())
      .then(({ data }) => {
        // Only show entries that have a media URL
        setSubmissions((data ?? []).filter((s: Submission) => s.media_url));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const photoCount = submissions.filter((s) => s.media_type === "photo").length;
  const videoCount = submissions.filter((s) => s.media_type === "video").length;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader variant="dark" />

      {/* ── Hero ── */}
      <section className="bg-[#070b2f] text-white">
        <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-12 md:pb-16 md:pt-16">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
            Kystobservatørene
          </p>
          <h1 className="mt-4 text-5xl font-black uppercase tracking-tight md:text-7xl">
            <span className="text-white/40">Obs</span>
            <span className="text-white">ervasjoner</span>
          </h1>
          {!loading && (
            <div className="mt-4 flex gap-4 text-sm text-white/50">
              <span>{photoCount} bilder</span>
              <span>·</span>
              <span>{videoCount} videoer</span>
            </div>
          )}
        </div>

        {/* Wave divider */}
        <div className="relative h-16 bg-[#070b2f]">
          <svg className="absolute bottom-0 h-16 w-full" viewBox="0 0 1440 64" preserveAspectRatio="none">
            <path
              d="M0,48L120,42C240,36,480,28,720,32C960,36,1200,52,1320,58L1440,64L1440,64L0,64Z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </section>

      {/* ── Grid ── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-16">

          {loading && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          )}

          {!loading && submissions.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-4xl">📷</p>
              <p className="mt-4 text-lg font-semibold text-slate-700">
                Ingen observasjoner ennå
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Bli den første til å bidra!
              </p>
              <a
                href="/observasjoner"
                className="mt-6 inline-block rounded-full bg-[#070b2f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2744]"
              >
                Send inn observasjon →
              </a>
            </div>
          )}

          {!loading && submissions.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {submissions.map((sub) => (
                <GalleryCard key={sub.id} sub={sub} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#070b2f] text-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/norce-logo.png" alt="NORCE" className="h-8 object-contain opacity-80" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/fremje-logo.png"
                alt="Fremje"
                className="h-16 object-contain opacity-80"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
            <div className="text-xs text-white/60">© 2026 Kystobservatørene</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
