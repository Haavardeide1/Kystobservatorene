"use client";

import { useEffect, useState } from "react";

type Submission = {
  id: string;
  user_id: string | null;
  display_name: string | null;
  created_at: string;
};

type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  count: number;
};

const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_BG = [
  "bg-amber-50 border-amber-200",
  "bg-slate-50 border-slate-200",
  "bg-orange-50 border-orange-200",
];
const MEDAL_COUNT_COLOR = [
  "text-amber-500",
  "text-slate-400",
  "text-orange-400",
];

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
    ((now.getTime() - startOfYear.getTime()) / 86400000 +
      startOfYear.getDay() +
      1) /
      7
  );
  const fmt = (d: Date) =>
    d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
  return `Uke ${weekNum} · ${fmt(start)} – ${fmt(end)}`;
}

function buildLeaderboard(submissions: Submission[]): LeaderboardEntry[] {
  const weekStart = getWeekStart();

  // Only this week, only logged-in users
  const thisWeek = submissions.filter(
    (s) => s.user_id && new Date(s.created_at) >= weekStart
  );

  // Group by user_id, count submissions
  const map = new Map<string, LeaderboardEntry>();
  for (const s of thisWeek) {
    const uid = s.user_id!;
    if (map.has(uid)) {
      map.get(uid)!.count++;
    } else {
      map.set(uid, {
        user_id: uid,
        display_name: s.display_name || "Ukjent bruker",
        count: 1,
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export default function TopFive() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const weekLabel = getWeekLabel();

  useEffect(() => {
    fetch("/api/submissions/list")
      .then((r) => r.json())
      .then(({ data }) => {
        setLeaderboard(buildLeaderboard(data ?? []));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/60" />
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="rounded-3xl bg-white px-8 py-12 text-center shadow-sm">
        <div className="mx-auto mb-4 text-4xl">🏆</div>
        <p className="text-base font-semibold text-slate-800">
          Ingen konkurranseregistreringer denne uken ennå
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Logg inn og send inn observasjoner for å komme på listen!
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <a
            href="/login"
            className="rounded-full border border-[#070b2f] px-6 py-2.5 text-sm font-semibold text-[#070b2f] transition hover:bg-[#070b2f] hover:text-white"
          >
            Logg inn
          </a>
          <a
            href="/observasjoner"
            className="rounded-full bg-[#070b2f] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f2744]"
          >
            Send inn →
          </a>
        </div>
        <div className="mt-8 border-t border-slate-100 pt-4 text-xs uppercase tracking-[0.2em] text-slate-400">
          {weekLabel}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {leaderboard.map((entry, i) => {
          const isMedal = i < 3;
          return (
            <div
              key={entry.user_id}
              className={`flex items-center gap-4 rounded-2xl border px-5 py-4 ${
                isMedal ? MEDAL_BG[i] : "border-slate-100 bg-white"
              }`}
            >
              {/* Medal / rank */}
              <div className="w-10 shrink-0 text-center">
                {isMedal ? (
                  <span className="text-2xl">{MEDALS[i]}</span>
                ) : (
                  <span className="text-lg font-black text-slate-200">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
              </div>

              {/* Avatar initial */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#070b2f] text-sm font-bold text-white">
                {entry.display_name[0].toUpperCase()}
              </div>

              {/* Name */}
              <div className="flex-1 truncate">
                <p className="truncate font-semibold text-slate-800">
                  {entry.display_name}
                </p>
                <p className="text-xs text-slate-400">
                  {entry.count === 1
                    ? "1 observasjon"
                    : `${entry.count} observasjoner`}
                </p>
              </div>

              {/* Count badge */}
              <div
                className={`shrink-0 text-2xl font-black ${
                  isMedal ? MEDAL_COUNT_COLOR[i] : "text-slate-200"
                }`}
              >
                {entry.count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {weekLabel}
        </p>
        <a
          href="/observasjoner"
          className="rounded-full border border-[#070b2f] px-5 py-2 text-xs font-semibold text-[#070b2f] transition hover:bg-[#070b2f] hover:text-white"
        >
          + Send inn og konkurrer
        </a>
      </div>
    </div>
  );
}
