import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function getUserIdFromAuthHeader(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

type Submission = {
  id: string;
  media_type: string;
  lat_public: number | null;
  lng_public: number | null;
  created_at: string;
  level: number | null;
  wind_dir: string | null;
  wave_dir: string | null;
};

/** Haversine distance in km */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Find max cluster of submissions within radiusKm of any single point */
function maxClusterCount(subs: Submission[], radiusKm: number): number {
  const geo = subs.filter((s) => s.lat_public != null && s.lng_public != null);
  let max = 0;
  for (const c of geo) {
    const count = geo.filter(
      (s) => haversineKm(c.lat_public!, c.lng_public!, s.lat_public!, s.lng_public!) <= radiusKm
    ).length;
    if (count > max) max = count;
  }
  return max;
}

/** Current streak in consecutive days (up to today or yesterday) */
function computeStreak(subs: Submission[]): number {
  if (subs.length === 0) return 0;
  const days = Array.from(new Set(subs.map((s) => s.created_at.slice(0, 10)))).sort(
    (a, b) => b.localeCompare(a)
  );
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diffMs = new Date(days[i - 1]).getTime() - new Date(days[i]).getTime();
    if (Math.round(diffMs / 86_400_000) === 1) streak++;
    else break;
  }
  return streak;
}

/**
 * For a count-based badge, return the ISO timestamp of the submission
 * that pushed the count to exactly `threshold` (i.e. when it was first earned).
 */
function earnedAtForCount(subs: Submission[], threshold: number): string | null {
  if (subs.length < threshold) return null;
  const sorted = [...subs].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return sorted[threshold - 1]?.created_at ?? null;
}

export async function GET(req: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const userId = await getUserIdFromAuthHeader(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: rawSubs, error } = await supabaseAdmin
      .from("submissions")
      .select("id, media_type, lat_public, lng_public, created_at, level, wind_dir, wave_dir")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const subs = (rawSubs ?? []) as Submission[];
    const total = subs.length;

    // ── Derived stats ──────────────────────────────────────────────────────
    const streak = computeStreak(subs);
    const localHero = maxClusterCount(subs, 10);

    const uniquePoints = new Set(
      subs
        .filter((s) => s.lat_public != null && s.lng_public != null)
        .map((s) => `${s.lat_public!.toFixed(2)},${s.lng_public!.toFixed(2)}`)
    ).size;

    const winterSubs = subs.filter((s) => {
      const m = new Date(s.created_at).getMonth() + 1;
      return m === 12 || m === 1 || m === 2;
    });
    const summerSubs = subs.filter((s) => {
      const m = new Date(s.created_at).getMonth() + 1;
      return m >= 6 && m <= 8;
    });
    const uniqueMonths = new Set(subs.map((s) => new Date(s.created_at).getMonth() + 1)).size;

    const stormSubs = subs.filter((s) => (s.level ?? 0) >= 2);
    const calmSubs = subs.filter((s) => s.level === 1);
    const windSubs = subs.filter((s) => s.wind_dir);
    const waveSubs = subs.filter((s) => s.wave_dir);

    // ── Badge definitions with computed progress ───────────────────────────
    type BadgeSpec = {
      key: string;
      progress: number;
      threshold: number;
      earnedAt: string | null;
    };

    const specs: BadgeSpec[] = [
      // Innsendinger
      { key: "first_wave",           progress: Math.min(total, 1),   threshold: 1,   earnedAt: earnedAtForCount(subs, 1) },
      { key: "active_observer",      progress: Math.min(total, 5),   threshold: 5,   earnedAt: earnedAtForCount(subs, 5) },
      { key: "dedicated_observer",   progress: Math.min(total, 10),  threshold: 10,  earnedAt: earnedAtForCount(subs, 10) },
      { key: "experienced_observer", progress: Math.min(total, 25),  threshold: 25,  earnedAt: earnedAtForCount(subs, 25) },
      { key: "master_observer",      progress: Math.min(total, 50),  threshold: 50,  earnedAt: earnedAtForCount(subs, 50) },
      { key: "elite_observer",       progress: Math.min(total, 100), threshold: 100, earnedAt: earnedAtForCount(subs, 100) },
      { key: "legendary_observer",   progress: Math.min(total, 250), threshold: 250, earnedAt: earnedAtForCount(subs, 250) },
      // Geografi
      { key: "local_hero",           progress: Math.min(localHero, 10),    threshold: 10,  earnedAt: localHero >= 10 ? subs[subs.length - 1]?.created_at ?? null : null },
      { key: "regional_explorer",    progress: 0,                           threshold: 3,   earnedAt: null },
      { key: "national_observer",    progress: 0,                           threshold: 5,   earnedAt: null },
      { key: "coast_master",         progress: Math.min(uniquePoints, 100), threshold: 100, earnedAt: uniquePoints >= 100 ? subs[subs.length - 1]?.created_at ?? null : null },
      // Streaks
      { key: "week_streak",     progress: Math.min(streak, 7),                threshold: 7,  earnedAt: streak >= 7  ? new Date().toISOString() : null },
      { key: "month_streak",    progress: Math.min(streak, 30),               threshold: 30, earnedAt: streak >= 30 ? new Date().toISOString() : null },
      { key: "winter_observer", progress: Math.min(winterSubs.length, 10),    threshold: 10, earnedAt: earnedAtForCount(winterSubs, 10) },
      { key: "summer_observer", progress: Math.min(summerSubs.length, 10),    threshold: 10, earnedAt: earnedAtForCount(summerSubs, 10) },
      { key: "year_round",      progress: Math.min(uniqueMonths, 12),         threshold: 12, earnedAt: uniqueMonths >= 12 ? subs[subs.length - 1]?.created_at ?? null : null },
      // Forhold
      { key: "storm_hunter",  progress: Math.min(stormSubs.length, 5),  threshold: 5,  earnedAt: earnedAtForCount(stormSubs, 5) },
      { key: "calm_guardian",  progress: Math.min(calmSubs.length, 10), threshold: 10, earnedAt: earnedAtForCount(calmSubs, 10) },
      { key: "wind_meter",     progress: Math.min(windSubs.length, 20), threshold: 20, earnedAt: earnedAtForCount(windSubs, 20) },
      { key: "wave_expert",    progress: Math.min(waveSubs.length, 20), threshold: 20, earnedAt: earnedAtForCount(waveSubs, 20) },
    ];

    const data = specs.map((s) => ({
      key: s.key,
      progress: s.progress,
      threshold: s.threshold,
      earnedAt: s.earnedAt,
      status: (s.earnedAt ? "earned" : s.progress > 0 ? "active" : "locked") as
        | "earned"
        | "active"
        | "locked",
    }));

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
