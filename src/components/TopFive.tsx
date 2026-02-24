"use client";

import { useEffect, useState } from "react";

type Submission = {
  id: string;
  media_type: "photo" | "video";
  lat_public: number | null;
  lng_public: number | null;
  display_name: string | null;
  created_at: string;
  media_url: string | null;
  valg: string | null;
};

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekLabel(): string {
  const now = new Date();
  const start = getWeekStart();
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );

  const fmt = (d: Date) =>
    d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });

  return `Uke ${weekNum} · ${fmt(start)} – ${fmt(end)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
  });
}

export default function TopFive() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/submissions/list")
      .then((r) => r.json())
      .then(({ data }) => {
        const weekStart = getWeekStart();
        const thisWeek = (data ?? [])
          .filter((s: Submission) => new Date(s.created_at) >= weekStart)
          .slice(0, 5);
        setSubmissions(thisWeek);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const weekLabel = getWeekLabel();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/60" />
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-3xl bg-white px-8 py-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf2fb] text-2xl">
          🌊
        </div>
        <p className="text-base font-semibold text-slate-800">
          Ingen observasjoner denne uken ennå
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Vær den første til å sende inn — det tar under ett minutt.
        </p>
        <a
          href="/observasjoner"
          className="mt-6 inline-block rounded-full bg-[#070b2f] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2744]"
        >
          Send inn observasjon →
        </a>
        <div className="mt-8 border-t border-slate-100 pt-4 text-xs uppercase tracking-[0.2em] text-slate-400">
          {weekLabel}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {submissions.map((sub, i) => (
          <div
            key={sub.id}
            className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm"
          >
            {/* Rank */}
            <span className="w-7 shrink-0 text-lg font-black text-slate-200">
              {String(i + 1).padStart(2, "0")}
            </span>

            {/* Thumbnail */}
            {sub.media_url && sub.media_type === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sub.media_url}
                alt=""
                className="h-14 w-14 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl ${
                  sub.media_type === "photo" ? "bg-blue-50" : "bg-emerald-50"
                }`}
              >
                {sub.media_type === "photo" ? "📸" : "🎥"}
              </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {sub.display_name || "Anonym"}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>{formatDate(sub.created_at)}</span>
                {sub.valg && (
                  <>
                    <span className="text-slate-200">·</span>
                    <span>{sub.valg}</span>
                  </>
                )}
                {sub.lat_public && (
                  <>
                    <span className="text-slate-200">·</span>
                    <span className="text-emerald-500">📍 Posisjon</span>
                  </>
                )}
              </div>
            </div>

            {/* Type badge + map link */}
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  sub.media_type === "photo"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {sub.media_type === "photo" ? "Bilde" : "Video"}
              </span>
              <a
                href="/kart"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50"
                title="Se på kartet"
              >
                Kart →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Footer row */}
      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {weekLabel}
        </p>
        <a
          href="/observasjoner"
          className="rounded-full border border-[#070b2f] px-5 py-2 text-xs font-semibold text-[#070b2f] transition hover:bg-[#070b2f] hover:text-white"
        >
          + Send inn din observasjon
        </a>
      </div>
    </div>
  );
}
