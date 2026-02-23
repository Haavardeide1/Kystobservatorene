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

export async function GET(req: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const userId = await getUserIdFromAuthHeader(authHeader);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    type UserBadgeRow = {
      progress: number | null;
      earned_at: string | null;
      user_id: string | null;
    };

    type BadgeRow = {
      id: string;
      key: string;
      title: string;
      description: string | null;
      threshold: number | null;
      user_badges?: UserBadgeRow[] | null;
    };

    const { data: badges, error } = await supabaseAdmin
      .from("badges")
      .select(["id", "key", "title", "description", "threshold"].join(","))
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: userBadges, error: userBadgesError } = await supabaseAdmin
      .from("user_badges")
      .select("badge_id, progress, earned_at")
      .eq("user_id", userId);

    if (userBadgesError) {
      return NextResponse.json({ error: userBadgesError.message }, { status: 400 });
    }

    const userBadgeMap = new Map(
      (userBadges ?? []).map((row) => [row.badge_id, row])
    );

    const rows = ((badges ?? []) as unknown as BadgeRow[]).map((badge) => {
      const ub = userBadgeMap.get(badge.id) ?? null;
      const progress = ub?.progress ?? 0;
      const threshold = badge.threshold ?? 0;
      const earnedAt = ub?.earned_at ?? null;
      let status: "locked" | "active" | "earned" = "locked";
      if (earnedAt) status = "earned";
      else if (progress > 0) status = "active";

      return {
        key: badge.key,
        title: badge.title,
        description: badge.description,
        progress,
        threshold,
        earnedAt,
        status,
      };
    });

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
