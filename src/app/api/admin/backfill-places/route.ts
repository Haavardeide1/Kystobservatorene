import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          "Accept-Language": "nb",
          "User-Agent": "Kystobservatorene/1.0 (kystobservatorene.no)",
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    return (
      a.city || a.town || a.village || a.hamlet || a.suburb ||
      a.municipality || a.county || a.state ||
      a.body_of_water || a.sea || a.bay ||
      (data.display_name ? data.display_name.split(",")[0].trim() : null) ||
      null
    );
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rows, error } = await supabaseAdmin
    .from("submissions")
    .select("id, lat_public, lng_public")
    .is("place_name", null)
    .not("lat_public", "is", null)
    .not("lng_public", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = { updated: 0, failed: 0, total: rows?.length ?? 0 };

  for (const row of rows ?? []) {
    const place = await reverseGeocode(row.lat_public, row.lng_public);
    if (place) {
      await supabaseAdmin
        .from("submissions")
        .update({ place_name: place })
        .eq("id", row.id);
      results.updated++;
    } else {
      results.failed++;
    }
    await sleep(1100);
  }

  return NextResponse.json(results);
}
