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

function buildLeaderboard(submissions: Submission[]): LeaderboardEntry[] {
  const weekStart = getWeekStart();
  const thisWeek = submissions.filter(
    (s) => s.user_id && new Date(s.created_at) >= weekStart
  );
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

// Card style per rank
const CARD_STYLE = [
  // 1st — dark navy with gold ring
  "bg-[#070b2f] border border-amber-400/30 shadow-lg",
  // 2nd — dark navy, silver tone
  "bg-[#0f1f3d] border border-white/10 shadow-md",
  // 3rd — dark navy, bronze tone
  "bg-[#0f1f3d] border border-orange-400/20 shadow-md",
  // 4th & 5th — white
  "bg-white border border-slate-100 shadow-sm",
  "bg-white border border-slate-100 shadow-sm",
];

const MEDAL_LABEL = [
  { emoji: "🥇", label: "Gull", countColor: "text-amber-400" },
  { emoji: "🥈", label: "Sølv", countColor: "text-slate-300" },
  { emoji: "🥉", label: "Bronse", countColor: "text-orange-300" },
];

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
      <div className="rounded-3xl bg-[#070b2f] px-8 py-12 text-center text-white shadow-lg">
        <div className="mx-auto mb-4 text-4xl">🏆</div>
        <p className="text-base font-semibold">
          Ingen konkurranseregistreringer denne uken ennå
        </p>
        <p className="mt-2 text-sm text-white/60">
          Logg inn og send inn observasjoner for å komme på listen!
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <a
            href="/login"
            className="rounded-full border border-white/30 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Logg inn
          </a>
          <a
            href="/observasjoner"
            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#070b2f] transition hover:bg-white/90"
          >
            Send inn →
          </a>
        </div>
        <div className="mt-8 border-t border-white/10 pt-4 text-xs uppercase tracking-[0.2em] text-white/30">
          {weekLabel}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {leaderboard.map((entry, i) => {
          const isDark = i < 3;
          const medal = MEDAL_LABEL[i];

          return (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition md:gap-4 md:px-5 md:py-4 ${CARD_STYLE[i] ?? CARD_STYLE[4]}`}
            >
              {/* Medal or rank */}
              <div className="w-10 shrink-0 text-center">
                {isDark ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xl leading-none">{medal.emoji}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                      {medal.label}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-black text-slate-200">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
              </div>

              {/* Avatar initial */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isDark ? "bg-white/10 text-white" : "bg-[#070b2f] text-white"
                }`}
              >
                {entry.display_name[0].toUpperCase()}
              </div>

              {/* Name + sub-label */}
              <div className="flex-1 truncate">
                <p className={`truncate font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>
                  {entry.display_name}
                </p>
                <p className={`text-xs ${isDark ? "text-white/40" : "text-slate-400"}`}>
                  {entry.count === 1
                    ? "1 observasjon"
                    : `${entry.count} observasjoner`}
                </p>
              </div>

              {/* Count */}
              <div
                className={`shrink-0 text-2xl font-black md:text-3xl ${
                  isDark ? medal.countColor : "text-slate-200"
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
          className="rounded-full bg-[#070b2f] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#0f2744]"
        >
          + Send inn og konkurrer
        </a>
      </div>
    </div>
  );
}
