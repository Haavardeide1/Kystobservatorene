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

    const { data, error } = await supabaseAdmin
      .from("submissions")
      .select("media_type, lat_public, lng_public")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const rows = data ?? [];
    const total = rows.length;
    const photos = rows.filter((row) => row.media_type === "photo").length;
    const videos = rows.filter((row) => row.media_type === "video").length;
    const locations = new Set(
      rows
        .filter((row) => row.lat_public != null && row.lng_public != null)
        .map((row) => `${row.lat_public},${row.lng_public}`)
    ).size;

    return NextResponse.json({
      total,
      photos,
      videos,
      locations,
      badges: 1,
      streak: 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
