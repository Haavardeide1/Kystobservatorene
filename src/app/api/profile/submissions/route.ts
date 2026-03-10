import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const SIGNED_TTL = 60 * 60 * 24;

async function getUserIdFromAuthHeader(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromAuthHeader(req.headers.get("authorization"));
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from("submissions")
      .select("id, media_type, media_path_original, created_at, lat_public, lng_public, comment, valg, wind_dir, wave_dir, researcher_comment, researcher_name")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const rows = data ?? [];
    const paths = rows.map((r) => r.media_path_original);
    const { data: signedList } = await supabaseAdmin.storage
      .from("media")
      .createSignedUrls(paths, SIGNED_TTL);

    const urlMap = new Map((signedList ?? []).map((s) => [s.path, s.signedUrl]));

    const results = rows.map((row) => ({
      ...row,
      media_url: urlMap.get(row.media_path_original) ?? null,
    }));

    return NextResponse.json({ data: results }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
