import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyAdminRequest } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
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

    const SIGNED_TTL = 60 * 60;

    // Look up email for each unique user_id in one pass
    const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id).filter(Boolean))) as string[];
    const userEmailMap = new Map<string, string>();
    await Promise.all(
      userIds.map(async (uid) => {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(uid);
        if (user?.email) userEmailMap.set(uid, user.email);
      })
    );

    const rows = await Promise.all(
      (data ?? []).map(async (row) => {
        const { data: signed } = await supabaseAdmin.storage
          .from("media")
          .createSignedUrl(row.media_path_original, SIGNED_TTL);
        return {
          ...row,
          media_url: signed?.signedUrl ?? null,
          user_email: row.user_id ? (userEmailMap.get(row.user_id) ?? null) : null,
        };
      })
    );

    return NextResponse.json({ data: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
