import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("submissions")
      .select("id, display_name, media_type, media_path_original, created_at, researcher_comment, researcher_name, researcher_commented_at")
      .eq("is_public", true)
      .is("deleted_at", null)
      .not("researcher_comment", "is", null)
      .order("researcher_commented_at", { ascending: false })
      .limit(6);

    if (error) {
      return NextResponse.json({ data: [] });
    }

    const rows = data ?? [];
    const paths = rows.map((r) => r.media_path_original);
    const { data: signedList } = await supabaseAdmin.storage
      .from("media")
      .createSignedUrls(paths, 60 * 60 * 24);

    const urlMap = new Map((signedList ?? []).map((s) => [s.path, s.signedUrl]));

    const results = rows.map((row) => ({
      ...row,
      media_url: urlMap.get(row.media_path_original) ?? null,
    }));

    return NextResponse.json({ data: results }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
