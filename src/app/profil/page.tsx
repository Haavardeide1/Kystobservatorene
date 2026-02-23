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

const BADGE_CATALOG: Badge[] = [
  {
    key: "first_wave",
    title: "Første bølge",
    description: "Send inn din første observasjon.",
    progress: 0,
    threshold: 1,
    tier: "bronze",
    category: "innsendinger",
    status: "locked",
  },
  {
    key: "active_observer",
    title: "Aktiv observatør",
    description: "Send inn 5 observasjoner.",
    progress: 0,
    threshold: 5,
    tier: "bronze",
    category: "innsendinger",
    status: "locked",
  },
  {
    key: "dedicated_observer",
    title: "Dedikert observatør",
    description: "Send inn 10 observasjoner.",
    progress: 0,
    threshold: 10,
    tier: "silver",
    category: "innsendinger",
    status: "locked",
  },
  {
    key: "experienced_observer",
    title: "Erfaren observatør",
    description: "Send inn 25 observasjoner.",
    progress: 0,
    threshold: 25,
    tier: "gold",
    category: "innsendinger",
    status: "locked",
  },
  {
    key: "master_observer",
    title: "Mester observatør",
    description: "Send inn 50 observasjoner.",
    progress: 0,
    threshold: 50,
    tier: "gold",
    category: "innsendinger",
    status: "locked",
  },
  {
    key: "elite_observer",
    title: "Elite observatør",
    description: "Send inn 100 observasjoner.",
    progress: 0,
    threshold: 100,
    tier: "platinum",
    category: "innsendinger",
    status: "locked",
  },
  {
    key: "legendary_observer",
    title: "Legendarisk observatør",
    description: "Send inn 250 observasjoner.",
    progress: 0,
    threshold: 250,
    tier: "platinum",
    category: "innsendinger",
    status: "locked",
  },
  {
    key: "local_hero",
    title: "Lokal helt",
    description: "10 innsendinger innen 10 km radius.",
    progress: 0,
    threshold: 10,
    tier: "bronze",
    category: "geografi",
    status: "locked",
  },
  {
    key: "regional_explorer",
    title: "Regional utforsker",
    description: "Innsendinger fra 3 ulike fylker.",
    progress: 0,
    threshold: 3,
    tier: "silver",
    category: "geografi",
    status: "locked",
  },
  {
    key: "national_observer",
    title: "Nasjonal observatør",
    description: "Innsendinger fra 5+ fylker.",
    progress: 0,
    threshold: 5,
    tier: "gold",
    category: "geografi",
    status: "locked",
  },
  {
    key: "coast_master",
    title: "Kystlinje mester",
    description: "100 unike GPS‑punkter.",
    progress: 0,
    threshold: 100,
    tier: "platinum",
    category: "geografi",
    status: "locked",
  },
  {
    key: "week_streak",
    title: "Uke‑streak",
    description: "Send inn hver dag i 7 dager.",
    progress: 0,
    threshold: 7,
    tier: "bronze",
    category: "streaks",
    status: "locked",
  },
  {
    key: "month_streak",
    title: "Måned‑streak",
    description: "Send inn hver dag i 30 dager.",
    progress: 0,
    threshold: 30,
    tier: "gold",
    category: "streaks",
    status: "locked",
  },
  {
    key: "winter_observer",
    title: "Vinter observatør",
    description: "10 innsendinger i desember–februar.",
    progress: 0,
    threshold: 10,
    tier: "silver",
    category: "streaks",
    status: "locked",
  },
  {
    key: "summer_observer",
    title: "Sommer observatør",
    description: "10 innsendinger i juni–august.",
    progress: 0,
    threshold: 10,
    tier: "silver",
    category: "streaks",
    status: "locked",
  },
  {
    key: "year_round",
    title: "Hele året",
    description: "Innsendinger i alle 12 måneder.",
    progress: 0,
    threshold: 12,
    tier: "platinum",
    category: "streaks",
    status: "locked",
  },
  {
    key: "storm_hunter",
    title: "Stormjeger",
    description: "5 innsendinger med større bølger.",
    progress: 0,
    threshold: 5,
    tier: "gold",
    category: "forhold",
    status: "locked",
  },
  {
    key: "calm_guardian",
    title: "Rolig sjø‑vokter",
    description: "10 innsendinger med rolig havflate.",
    progress: 0,
    threshold: 10,
    tier: "bronze",
    category: "forhold",
    status: "locked",
  },
  {
    key: "wind_meter",
    title: "Vindmåler",
    description: "20 innsendinger med vindretning.",
    progress: 0,
    threshold: 20,
    tier: "silver",
    category: "forhold",
    status: "locked",
  },
  {
    key: "wave_expert",
    title: "Bølge‑ekspert",
    description: "20 innsendinger med bølgeretning.",
    progress: 0,
    threshold: 20,
    tier: "silver",
    category: "forhold",
    status: "locked",
  },
];

const TIER_STYLE: Record<Badge["tier"], { label: string; accent: string; glow: string }> = {
  bronze: { label: "Bronse", accent: "#d38b5d", glow: "from-[#fce7d6]" },
  silver: { label: "Sølv", accent: "#9aa4b2", glow: "from-[#e5e7eb]" },
  gold: { label: "Gull", accent: "#f2c94c", glow: "from-[#fff4d6]" },
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
        const res = await fetch("/api/profile/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = (await res.json()) as ProfileStats;
          if (isMounted) setStats(json);
        }

        const badgeRes = await fetch("/api/profile/badges", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (badgeRes.ok) {
          const json = (await badgeRes.json()) as BadgeApiResponse;
          const mapped = (json.data ?? []).map((item) => {
            const base = BADGE_CATALOG.find((badge) => badge.key === item.key);
            return {
              key: item.key,
              title: item.title ?? base?.title ?? "Ukjent",
              description: item.description ?? base?.description ?? "",
              progress: item.progress ?? 0,
              threshold: item.threshold ?? base?.threshold ?? 0,
              tier: base?.tier ?? "bronze",
              category: base?.category ?? "innsendinger",
              status: item.status,
            } as Badge;
          });
          if (isMounted) setBadges(mapped);
        }
      } else {
        setStats(null);
        setBadges(null);
      }
    }

    loadUser();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const initials = useMemo(() => {
    if (username) return username.slice(0, 1).toUpperCase();
    if (email) return email.slice(0, 1).toUpperCase();
    return "?";
  }, [username, email]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!inputValue.trim()) {
      setMessage("Skriv inn et brukernavn.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { username: inputValue.trim() },
    });
    if (error) {
      setMessage(error.message);
    } else {
      setUsername(inputValue.trim());
      setMessage("Brukernavn lagret.");
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-[#eef2f7] text-slate-900">
      <SiteHeader variant="light" />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-12">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Profil
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-slate-900">
            Din side
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600 md:text-lg">
            Her finner du dine merker, statistikk og fremdrift. Første gang du
            logger inn kan du velge brukernavn.
          </p>
        </div>

        <section className="rounded-[28px] bg-white p-6 shadow-xl md:p-10">
          {!isLoggedIn && (
            <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Du må være logget inn for å se profilen din.{" "}
              <a className="font-semibold underline" href="/login">
                Logg inn her
              </a>
              .
            </div>
          )}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1d5fa7] text-2xl font-semibold text-white">
              {initials}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">
                {username ?? "Velkommen"}
              </h2>
              <p className="text-sm text-slate-500">{email ?? ""}</p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Aktiv medlem
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            {!username && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Brukernavn
                </p>
                <h3 className="mt-3 text-lg font-semibold text-slate-800">
                  Velg brukernavn
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Dette vises på offentlige bidrag og i kartet. Kun første gang du
                  logger inn må du sette et brukernavn.
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
                {message && (
                  <p className="mt-3 text-sm text-slate-600">{message}</p>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Dine statistikker
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Observasjoner", value: stats?.total ?? 0 },
                  { label: "Merker opptjent", value: stats?.badges ?? 0 },
                  { label: "Steder", value: stats?.locations ?? 0 },
                  { label: "Streak", value: `${stats?.streak ?? 0} dager` },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-[#f6f7fb] px-5 py-4 text-center"
                  >
                    <div className="text-2xl font-semibold text-slate-900">
                      {stat.value}
                    </div>
                    <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[28px] bg-white p-6 shadow-xl md:p-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Merker
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                Fremdrift og belønninger
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Oppdateres når du sender inn
            </span>
          </div>

          <div className="mt-6 space-y-8">
            {[
              { key: "innsendinger", label: "Antall innsendinger", icon: "🌊" },
              { key: "geografi", label: "Geografisk spredning", icon: "🗺️" },
              { key: "streaks", label: "Aktivitets‑streaks", icon: "🔥" },
              { key: "forhold", label: "Spesielle forhold", icon: "🌪️" },
            ].map((group) => {
              const groupBadges = (badges ?? BADGE_CATALOG).filter(
                (badge) => badge.category === group.key
              );
              return (
                <div key={group.key}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{group.icon}</span>
                      <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                        {group.label}
                      </h4>
                    </div>
                    <span className="text-xs text-slate-400">
                      Oppdateres automatisk
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groupBadges.map((badge) => {
                      const tier = TIER_STYLE[badge.tier];
                      const progressPct =
                        badge.threshold > 0
                          ? Math.min(100, (badge.progress / badge.threshold) * 100)
                          : 0;
                      const statusLabel =
                        badge.status === "earned"
                          ? "Oppnådd"
                          : badge.status === "active"
                          ? "I gang"
                          : "Låst";
                      return (
                        <div
                          key={badge.key}
                          className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition ${
                            badge.status === "earned"
                              ? "ring-2 ring-emerald-200"
                              : badge.status === "active"
                              ? "ring-1 ring-blue-100"
                              : ""
                          }`}
                        >
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${tier.glow} to-white opacity-60`}
                          />
                          <div className="relative flex items-start gap-4">
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg"
                              style={{ backgroundColor: `${tier.accent}22` }}
                            >
                              {badge.status === "earned" ? "✅" : "🏅"}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-800">
                                  {badge.title}
                                </p>
                                <span
                                  className="rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em]"
                                  style={{
                                    backgroundColor: `${tier.accent}22`,
                                    color: tier.accent,
                                  }}
                                >
                                  {tier.label}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">
                                {badge.description}
                              </p>
                              <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                                <div
                                  className="h-2 rounded-full"
                                  style={{
                                    width: `${progressPct}%`,
                                    backgroundColor: tier.accent,
                                  }}
                                />
                              </div>
                              <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400">
                                <span>
                                  {badge.progress}/{badge.threshold}
                                </span>
                                <span>{statusLabel}</span>
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
