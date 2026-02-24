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

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const days = Array.from(new Set(dates.map((d) => d.slice(0, 10)))).sort(
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

    const { data, error } = await supabaseAdmin
      .from("submissions")
      .select("media_type, lat_public, lng_public, created_at")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const rows = data ?? [];
    const total = rows.length;
    const photos = rows.filter((r) => r.media_type === "photo").length;
    const videos = rows.filter((r) => r.media_type === "video").length;
    const locations = new Set(
      rows
        .filter((r) => r.lat_public != null && r.lng_public != null)
        .map((r) => `${r.lat_public},${r.lng_public}`)
    ).size;
    const streak = computeStreak(rows.map((r) => r.created_at));

    // Count earned badges (progress >= threshold) by re-using the same logic
    // Simple count: badges where total meets threshold
    const earnedCount = [1, 5, 10, 25, 50, 100, 250].filter((t) => total >= t).length;

    return NextResponse.json({ total, photos, videos, locations, badges: earnedCount, streak });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
