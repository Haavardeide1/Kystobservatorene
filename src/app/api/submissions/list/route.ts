import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Never cache — deletions must propagate immediately
export const dynamic = "force-dynamic";

const MEDIA_BUCKET = "media";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

type SubmissionRow = {
  id: string;
  user_id: string | null;
  level: number;
  media_type: "photo" | "video";
  media_path_original: string;
  created_at: string;
  lat_public: number | null;
  lng_public: number | null;
  display_name: string | null;
  comment: string | null;
  valg: string | null;
  wind_dir: string | null;
  wave_dir: string | null;
  video_duration: number | null;
  video_analysis: Record<string, unknown> | null;
};

export async function GET() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("submissions")
      .select(
        [
          "id",
          "user_id",
          "level",
          "media_type",
          "media_path_original",
          "created_at",
          "lat_public",
          "lng_public",
          "display_name",
          "comment",
          "valg",
          "wind_dir",
          "wave_dir",
          "video_duration",
          "video_analysis",
        ].join(",")
      )
      .eq("is_public", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const rows = (data ?? []) as unknown as SubmissionRow[];
    const results = await Promise.all(
      rows.map(async (row) => {
        const { data: signed, error: signedError } = await supabaseAdmin.storage
          .from(MEDIA_BUCKET)
          .createSignedUrl(row.media_path_original, SIGNED_URL_TTL_SECONDS);

        return {
          ...row,
          media_url: signedError ? null : signed?.signedUrl ?? null,
        };
      })
    );

    return NextResponse.json({ data: results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
