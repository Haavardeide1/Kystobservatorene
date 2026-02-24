"use client";

import { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/site/SiteHeader";
import { supabase } from "@/lib/supabase";

type Badge = {
  key: string;
  title: string;
  description: string;
  progress: number;
  threshold: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  category: "innsendinger" | "geografi" | "streaks" | "forhold";
  status: "locked" | "active" | "earned";
};

type ProfileStats = {
  total: number;
  photos: number;
  videos: number;
  locations: number;
  badges: number;
  streak: number;
};

type BadgeApiItem = {
  key: string;
  title: string;
  description: string | null;
  progress: number;
  threshold: number | null;
  earnedAt: string | null;
  status: Badge["status"];
};

type BadgeApiResponse = {
  data: BadgeApiItem[];
};

// ── XP config ────────────────────────────────────────────────────────────────
const XP_PER_SUBMISSION = 10;

const TIER_XP: Record<Badge["tier"], number> = {
  bronze: 100,
  silver: 250,
  gold: 500,
  platinum: 1000,
};

type LevelDef = {
  level: number;
  title: string;
  minXp: number;
  color: string;
  bg: string;
};

const LEVELS: LevelDef[] = [
  { level: 1,  title: "Nybegynner",    minXp: 0,     color: "#64748b", bg: "#f1f5f9" },
  { level: 2,  title: "Strandvakt",    minXp: 150,   color: "#16a34a", bg: "#dcfce7" },
  { level: 3,  title: "Kystfarer",     minXp: 400,   color: "#0891b2", bg: "#cffafe" },
  { level: 4,  title: "Havkjentmann",  minXp: 800,   color: "#2563eb", bg: "#dbeafe" },
  { level: 5,  title: "Kystmester",    minXp: 1400,  color: "#7c3aed", bg: "#ede9fe" },
  { level: 6,  title: "Havekspert",    minXp: 2200,  color: "#9333ea", bg: "#f3e8ff" },
  { level: 7,  title: "Kystnavigator", minXp: 3500,  color: "#c026d3", bg: "#fae8ff" },
  { level: 8,  title: "Havforsker",    minXp: 5500,  color: "#e11d48", bg: "#ffe4e6" },
  { level: 9,  title: "Kystlegende",   minXp: 8500,  color: "#ea580c", bg: "#ffedd5" },
  { level: 10, title: "Havvokter",     minXp: 13000, color: "#d97706", bg: "#fef3c7" },
];

function getLevelInfo(xp: number) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXp) current = lvl;
    else break;
  }
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1] ?? null;
  const progressPct = next
    ? Math.min(100, ((xp - current.minXp) / (next.minXp - current.minXp)) * 100)
    : 100;
  const xpIntoLevel = xp - current.minXp;
  const xpNeeded = next ? next.minXp - current.minXp : 0;
  return { current, next, progressPct, xpIntoLevel, xpNeeded };
}

// ── Badge catalog ─────────────────────────────────────────────────────────────
const BADGE_CATALOG: Badge[] = [
  { key: "first_wave",           title: "Første bølge",        description: "Send inn din første observasjon.",      progress: 0, threshold: 1,   tier: "bronze",   category: "innsendinger", status: "locked" },
  { key: "active_observer",      title: "Aktiv observatør",    description: "Send inn 5 observasjoner.",             progress: 0, threshold: 5,   tier: "bronze",   category: "innsendinger", status: "locked" },
  { key: "dedicated_observer",   title: "Dedikert observatør", description: "Send inn 10 observasjoner.",            progress: 0, threshold: 10,  tier: "silver",   category: "innsendinger", status: "locked" },
  { key: "experienced_observer", title: "Erfaren observatør",  description: "Send inn 25 observasjoner.",            progress: 0, threshold: 25,  tier: "gold",     category: "innsendinger", status: "locked" },
  { key: "master_observer",      title: "Mester observatør",   description: "Send inn 50 observasjoner.",            progress: 0, threshold: 50,  tier: "gold",     category: "innsendinger", status: "locked" },
  { key: "elite_observer",       title: "Elite observatør",    description: "Send inn 100 observasjoner.",           progress: 0, threshold: 100, tier: "platinum", category: "innsendinger", status: "locked" },
  { key: "legendary_observer",   title: "Legendarisk observatør", description: "Send inn 250 observasjoner.",        progress: 0, threshold: 250, tier: "platinum", category: "innsendinger", status: "locked" },
  { key: "local_hero",           title: "Lokal helt",          description: "10 innsendinger innen 10 km radius.",   progress: 0, threshold: 10,  tier: "bronze",   category: "geografi",     status: "locked" },
  { key: "regional_explorer",    title: "Regional utforsker",  description: "Innsendinger fra 3 ulike fylker.",      progress: 0, threshold: 3,   tier: "silver",   category: "geografi",     status: "locked" },
  { key: "national_observer",    title: "Nasjonal observatør", description: "Innsendinger fra 5 eller flere fylker.", progress: 0, threshold: 5,   tier: "gold",     category: "geografi",     status: "locked" },
  { key: "coast_master",         title: "Kystlinjemester",     description: "100 unike GPS-punkter.",                progress: 0, threshold: 100, tier: "platinum", category: "geografi",     status: "locked" },
  { key: "week_streak",          title: "Ukestreak",           description: "Send inn hver dag i 7 dager.",          progress: 0, threshold: 7,   tier: "bronze",   category: "streaks",      status: "locked" },
  { key: "month_streak",         title: "Månedstreak",         description: "Send inn hver dag i 30 dager.",         progress: 0, threshold: 30,  tier: "gold",     category: "streaks",      status: "locked" },
  { key: "winter_observer",      title: "Vinterobservatør",    description: "10 innsendinger i desember–februar.",   progress: 0, threshold: 10,  tier: "silver",   category: "streaks",      status: "locked" },
  { key: "summer_observer",      title: "Sommerobservatør",    description: "10 innsendinger i juni–august.",        progress: 0, threshold: 10,  tier: "silver",   category: "streaks",      status: "locked" },
  { key: "year_round",           title: "Hele året",           description: "Innsendinger i alle 12 måneder.",       progress: 0, threshold: 12,  tier: "platinum", category: "streaks",      status: "locked" },
  { key: "storm_hunter",         title: "Stormjeger",          description: "5 innsendinger med større bølger.",     progress: 0, threshold: 5,   tier: "gold",     category: "forhold",      status: "locked" },
  { key: "calm_guardian",        title: "Rolig sjøvokter",     description: "10 innsendinger med rolig havflate.",   progress: 0, threshold: 10,  tier: "bronze",   category: "forhold",      status: "locked" },
  { key: "wind_meter",           title: "Vindmåler",           description: "20 innsendinger med vindretning.",      progress: 0, threshold: 20,  tier: "silver",   category: "forhold",      status: "locked" },
  { key: "wave_expert",          title: "Bølgeekspert",        description: "20 innsendinger med bølgeretning.",     progress: 0, threshold: 20,  tier: "silver",   category: "forhold",      status: "locked" },
];

const TIER_STYLE: Record<Badge["tier"], { label: string; accent: string; glow: string }> = {
  bronze:   { label: "Bronse",  accent: "#d38b5d", glow: "from-[#fce7d6]" },
  silver:   { label: "Sølv",    accent: "#9aa4b2", glow: "from-[#e5e7eb]" },
  gold:     { label: "Gull",    accent: "#f2c94c", glow: "from-[#fff4d6]" },
  platinum: { label: "Platina", accent: "#7dd3fc", glow: "from-[#e0f2fe]" },
};

export default function ProfilPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [badges, setBadges] = useState<Badge[] | null>(null);
  const isLoggedIn = Boolean(email);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      const user = data.user;
      setEmail(user?.email ?? null);
      const stored = (user?.user_metadata?.username as string | undefined) ?? null;
      setUsername(stored);
      setInputValue(stored ?? "");

      if (user) {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) return;

        const [statsRes, badgeRes] = await Promise.all([
          fetch("/api/profile/stats",  { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/profile/badges", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (statsRes.ok && isMounted) {
          setStats((await statsRes.json()) as ProfileStats);
        }

        if (badgeRes.ok && isMounted) {
          const json = (await badgeRes.json()) as BadgeApiResponse;
          const apiMap = new Map((json.data ?? []).map((item) => [item.key, item]));
          const merged = BADGE_CATALOG.map((badge) => {
            const api = apiMap.get(badge.key);
            if (!api) return badge;
            return {
              ...badge,
              progress: api.progress ?? badge.progress,
              threshold: api.threshold ?? badge.threshold,
              status: api.status ?? badge.status,
            } as Badge;
          });
          setBadges(merged);
        }
      } else {
        setStats(null);
        setBadges(null);
      }
    }

    loadUser();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => { loadUser(); });
    return () => { isMounted = false; subscription.subscription.unsubscribe(); };
  }, []);

  // ── XP computation ────────────────────────────────────────────────────────
  const xpInfo = useMemo(() => {
    const submissionXp = (stats?.total ?? 0) * XP_PER_SUBMISSION;
    const earnedBadges = (badges ?? []).filter((b) => b.status === "earned");
    const badgeXp = earnedBadges.reduce((sum, b) => sum + TIER_XP[b.tier], 0);
    const totalXp = submissionXp + badgeXp;
    return { totalXp, submissionXp, badgeXp, ...getLevelInfo(totalXp) };
  }, [stats, badges]);

  const initials = useMemo(() => {
    if (username) return username.slice(0, 1).toUpperCase();
    if (email) return email.slice(0, 1).toUpperCase();
    return "?";
  }, [username, email]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!inputValue.trim()) { setMessage("Skriv inn et brukernavn."); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { username: inputValue.trim() } });
    if (error) { setMessage(error.message); }
    else { setUsername(inputValue.trim()); setMessage("Brukernavn lagret."); }
    setSaving(false);
  }

  const lvl = xpInfo.current;

  return (
    <div className="min-h-screen bg-[#eef2f7] text-slate-900">
      <SiteHeader variant="light" />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-12">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Profil</p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-slate-900">Din side</h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600 md:text-lg">
            Her finner du dine merker, statistikk og fremdrift.
          </p>
        </div>

        {/* ── Profil + XP-kort ───────────────────────────────────────────── */}
        <section className="rounded-[28px] bg-white p-6 shadow-xl md:p-10">
          {!isLoggedIn && (
            <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Du må være logget inn for å se profilen din.{" "}
              <a className="font-semibold underline" href="/login">Logg inn her</a>.
            </div>
          )}

          {/* Avatar + navn + level-chip */}
          <div className="flex flex-wrap items-center gap-6">
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-white"
              style={{ backgroundColor: lvl.color }}
            >
              {initials}
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm whitespace-nowrap"
                style={{ backgroundColor: lvl.color }}>
                Niv. {lvl.level}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">{username ?? "Velkommen"}</h2>
              <p className="text-sm text-slate-500">{email ?? ""}</p>
            </div>
            <div
              className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]"
              style={{ backgroundColor: lvl.bg, color: lvl.color }}
            >
              {lvl.title}
            </div>
          </div>

          {/* ── XP level-bar ─────────────────────────────────────────────── */}
          <div className="mt-8 rounded-2xl p-5" style={{ backgroundColor: lvl.bg }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: lvl.color }}>
                  Nivå {lvl.level} · {lvl.title}
                </p>
                <p className="mt-1 text-2xl font-black" style={{ color: lvl.color }}>
                  {xpInfo.totalXp.toLocaleString("nb-NO")} XP
                </p>
              </div>
              {xpInfo.next && (
                <div className="text-right">
                  <p className="text-xs text-slate-500">Neste: {xpInfo.next.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {(xpInfo.next.minXp - xpInfo.totalXp).toLocaleString("nb-NO")} XP igjen
                  </p>
                </div>
              )}
              {!xpInfo.next && (
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: lvl.color }}>
                  Maks nivå!
                </p>
              )}
            </div>
            <div className="mt-4 h-3 w-full rounded-full bg-black/10">
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{ width: `${xpInfo.progressPct}%`, backgroundColor: lvl.color }}
              />
            </div>
            {xpInfo.next && (
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>Nivå {lvl.level}: {lvl.minXp.toLocaleString("nb-NO")} XP</span>
                <span>Nivå {xpInfo.next.level}: {xpInfo.next.minXp.toLocaleString("nb-NO")} XP</span>
              </div>
            )}

            {/* XP breakdown */}
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-xs font-semibold text-slate-600">
                <span>🌊</span>
                <span>{stats?.total ?? 0} obs. × {XP_PER_SUBMISSION} XP = {xpInfo.submissionXp} XP</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-xs font-semibold text-slate-600">
                <span>🏅</span>
                <span>{(badges ?? []).filter((b) => b.status === "earned").length} merker = {xpInfo.badgeXp} XP</span>
              </div>
            </div>
          </div>

          {/* ── Stats + brukernavn ───────────────────────────────────────── */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            {!username && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Brukernavn</p>
                <h3 className="mt-3 text-lg font-semibold text-slate-800">Velg brukernavn</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Dette vises på offentlige bidrag og i kartet.
                </p>
                <form onSubmit={handleSave} className="mt-4 flex flex-col gap-3">
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={!isLoggedIn}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1d5fa7]"
                    placeholder="Skriv inn ønsket brukernavn"
                  />
                  <button
                    type="submit"
                    disabled={saving || !isLoggedIn}
                    className="rounded-xl bg-[#0b1b36] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {saving ? "Lagrer..." : "Lagre brukernavn"}
                  </button>
                </form>
                {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Dine statistikker</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Observasjoner", value: stats?.total ?? 0 },
                  { label: "Merker opptjent", value: (badges ?? []).filter((b) => b.status === "earned").length },
                  { label: "Steder", value: stats?.locations ?? 0 },
                  { label: "Streak", value: `${stats?.streak ?? 0} dager` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-[#f6f7fb] px-5 py-4 text-center">
                    <div className="text-2xl font-semibold text-slate-900">{stat.value}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Level-oversikt ────────────────────────────────────────────────── */}
        <section className="mt-6 rounded-[28px] bg-white p-6 shadow-xl md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Nivåer</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">Alle nivåer</h3>
          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {LEVELS.map((lv) => {
              const isCurrentLevel = lv.level === lvl.level;
              const isPassed = xpInfo.totalXp >= lv.minXp;
              return (
                <div
                  key={lv.level}
                  className={`rounded-2xl border-2 p-4 text-center transition ${
                    isCurrentLevel ? "shadow-md" : ""
                  }`}
                  style={{
                    borderColor: isCurrentLevel ? lv.color : isPassed ? `${lv.color}55` : "#e2e8f0",
                    backgroundColor: isPassed ? lv.bg : "#f8fafc",
                    opacity: isPassed ? 1 : 0.5,
                  }}
                >
                  <div className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: isPassed ? lv.color : "#94a3b8" }}>
                    Nivå {lv.level}
                  </div>
                  <div className="mt-1 text-sm font-semibold" style={{ color: isPassed ? lv.color : "#94a3b8" }}>
                    {lv.title}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">{lv.minXp.toLocaleString("nb-NO")} XP</div>
                  {isCurrentLevel && (
                    <div className="mt-2 rounded-full text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: lv.color }}>
                      ← Du er her
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* XP per badge-tier forklaring */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Slik tjener du XP</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: "🌊", label: "Observasjon", xp: XP_PER_SUBMISSION, note: "per innsendt observasjon" },
                { icon: "🥉", label: "Bronsemedalje", xp: TIER_XP.bronze, note: "per bronse-merke" },
                { icon: "🥈", label: "Sølvmedalje", xp: TIER_XP.silver, note: "per sølv-merke" },
                { icon: "🥇", label: "Gull / Platina", xp: `${TIER_XP.gold}–${TIER_XP.platinum}`, note: "per høyt merke" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 rounded-2xl bg-[#f6f7fb] px-4 py-3">
                  <span className="text-2xl">{row.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">+{row.xp} XP</div>
                    <div className="text-xs text-slate-400">{row.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Merker ───────────────────────────────────────────────────────── */}
        <section className="mt-6 rounded-[28px] bg-white p-6 shadow-xl md:p-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Merker</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">Fremdrift og belønninger</h3>
            </div>
            <span className="rounded-full bg-[#f6f7fb] px-3 py-1 text-xs font-semibold text-slate-500">
              {(badges ?? BADGE_CATALOG).filter((b) => b.status === "earned").length} /{" "}
              {BADGE_CATALOG.length} opptjent
            </span>
          </div>

          {/* Neste merke */}
          {badges && (() => {
            const next =
              badges.find((b) => b.status === "active") ??
              badges.find((b) => b.status === "locked" && b.threshold > 0);
            if (!next) return null;
            const tier = TIER_STYLE[next.tier];
            const pct = Math.min(100, (next.progress / next.threshold) * 100);
            const remaining = next.threshold - next.progress;
            return (
              <div className="mt-6 flex items-center gap-5 rounded-2xl border-2 border-blue-100 bg-blue-50 p-5">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
                  style={{ backgroundColor: `${tier.accent}22` }}
                >
                  🎯
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-400">Neste merke</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="mt-0.5 text-base font-semibold text-slate-800">{next.title}</p>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: `${tier.accent}22`, color: tier.accent }}>
                      +{TIER_XP[next.tier]} XP
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-blue-100">
                    <div className="h-2 rounded-full bg-blue-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {next.progress}/{next.threshold} —{" "}
                    <span className="font-semibold text-blue-600">{remaining} igjen</span>
                  </p>
                </div>
              </div>
            );
          })()}

          <div className="mt-8 space-y-8">
            {[
              { key: "innsendinger", label: "Antall innsendinger", icon: "🌊" },
              { key: "geografi",     label: "Geografisk spredning", icon: "🗺️" },
              { key: "streaks",      label: "Aktivitets‑streaks",   icon: "🔥" },
              { key: "forhold",      label: "Spesielle forhold",    icon: "🌪️" },
            ].map((group) => {
              const groupBadges = (badges ?? BADGE_CATALOG).filter((b) => b.category === group.key);
              const earnedInGroup = groupBadges.filter((b) => b.status === "earned").length;
              return (
                <div key={group.key}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{group.icon}</span>
                      <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{group.label}</h4>
                    </div>
                    <span className="text-xs text-slate-400">{earnedInGroup}/{groupBadges.length} opptjent</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groupBadges.map((badge) => {
                      const tier = TIER_STYLE[badge.tier];
                      const pct = badge.threshold > 0 ? Math.min(100, (badge.progress / badge.threshold) * 100) : 0;
                      const remaining = badge.threshold - badge.progress;
                      const xpValue = TIER_XP[badge.tier];
                      return (
                        <div
                          key={badge.key}
                          className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition ${
                            badge.status === "earned"
                              ? "ring-2 ring-emerald-300"
                              : badge.status === "active"
                              ? "ring-2 ring-blue-200"
                              : "opacity-70"
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${tier.glow} to-white opacity-50`} />
                          <div className="relative flex items-start gap-4">
                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl"
                              style={{ backgroundColor: `${tier.accent}22` }}
                            >
                              {badge.status === "earned" ? "✅" : badge.status === "active" ? "⏳" : "🔒"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-800 leading-tight">{badge.title}</p>
                                <span
                                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                                  style={{
                                    backgroundColor: badge.status === "earned" ? "#dcfce7" : `${tier.accent}22`,
                                    color: badge.status === "earned" ? "#16a34a" : tier.accent,
                                  }}
                                >
                                  +{xpValue} XP
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{badge.description}</p>
                              <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                                <div
                                  className="h-2 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: badge.status === "earned" ? "#10b981" : tier.accent,
                                  }}
                                />
                              </div>
                              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                                <span className="font-semibold">{badge.progress}/{badge.threshold}</span>
                                {badge.status === "earned" ? (
                                  <span className="font-semibold text-emerald-500">Oppnådd ✓</span>
                                ) : badge.status === "active" ? (
                                  <span className="font-semibold text-blue-500">{remaining} igjen</span>
                                ) : (
                                  <span>Låst</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
