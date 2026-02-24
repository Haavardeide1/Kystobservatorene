import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("submissions")
      .select(
        "id,user_id,display_name,media_type,media_path_original,created_at,lat_public,lng_public,comment,valg,wind_dir,wave_dir,level,is_public,deleted_at"
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Generate signed URLs for thumbnails
    const SIGNED_TTL = 60 * 60;
    const rows = await Promise.all(
      (data ?? []).map(async (row) => {
        const { data: signed } = await supabaseAdmin.storage
          .from("media")
          .createSignedUrl(row.media_path_original, SIGNED_TTL);
        return { ...row, media_url: signed?.signedUrl ?? null };
      })
    );

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
