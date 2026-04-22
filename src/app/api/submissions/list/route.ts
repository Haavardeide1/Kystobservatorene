import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Never cache — deletions must propagate immediately
export const dynamic = "force-dynamic";

const MEDIA_BUCKET = "media";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24; // 24 hours

type SubmissionRow = {
  id: string;
  user_id: string | null;
  level: number;
  media_type: "photo" | "video";
  media_path_original: string;
  media_path_preview: string | null;
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
          "media_path_preview",
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
          "place_name",
        ].join(",")
      )
      .eq("is_public", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const rows = (data ?? []) as unknown as SubmissionRow[];

    // Originale URLs (batch)
    const allPaths = [
      ...rows.map((r) => r.media_path_original),
      ...rows.filter((r) => r.media_path_preview).map((r) => r.media_path_preview!),
    ];
    const { data: signedList } = await supabaseAdmin.storage
      .from(MEDIA_BUCKET)
      .createSignedUrls(allPaths, SIGNED_URL_TTL_SECONDS);

    const urlMap = new Map(
      (signedList ?? []).map((s) => [s.path, s.signedUrl])
    );

    // Thumbnail URLs for bilder (400px, kvalitet 70) — vises i galleri-kort
    const photoRows = rows.filter((r) => r.media_type === "photo");
    const thumbnailResults = await Promise.all(
      photoRows.map((r) =>
        supabaseAdmin.storage.from(MEDIA_BUCKET).createSignedUrl(
          r.media_path_original,
          SIGNED_URL_TTL_SECONDS,
          { transform: { width: 400, height: 400, quality: 70, resize: "cover" } }
        )
      )
    );
    const thumbnailMap = new Map(
      photoRows.map((r, i) => [r.id, thumbnailResults[i].data?.signedUrl ?? null])
    );

    const results = rows.map((row) => ({
      ...row,
      media_url: urlMap.get(row.media_path_original) ?? null,
      thumbnail_url:
        row.media_type === "photo"
          ? (thumbnailMap.get(row.id) ?? urlMap.get(row.media_path_original) ?? null)
          : (urlMap.get(row.media_path_original) ?? null),
      preview_url: row.media_path_preview ? (urlMap.get(row.media_path_preview) ?? null) : null,
    }));

    return NextResponse.json({ data: results }, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
