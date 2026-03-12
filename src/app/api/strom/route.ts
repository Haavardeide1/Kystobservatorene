import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BW_TOKEN_URL = "https://id.barentswatch.no/connect/token";
const BW_API_BASE = "https://www.barentswatch.no/bwapi/v1/geodata";

const LOCATIONS = [
  { key: "saltstraumen",   name: "Saltstraumen" },
  { key: "kvalsundet",     name: "Kvalsundet" },
  { key: "rystraumen",     name: "Rystraumen" },
  { key: "sandnessundet",  name: "Sandnessundet" },
  { key: "tromsøysundet",  name: "Tromsøysundet" },
];

async function getToken(): Promise<string | null> {
  const clientId = process.env.BW_CLIENT_ID;
  const clientSecret = process.env.BW_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch(BW_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "api",
    }),
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

export async function GET() {
  try {
    const token = await getToken();
    if (!token) {
      return NextResponse.json(
        { error: "BW_CLIENT_ID og BW_CLIENT_SECRET er ikke konfigurert" },
        { status: 503 }
      );
    }

    const results = await Promise.allSettled(
      LOCATIONS.map(async ({ key, name }) => {
        const res = await fetch(`${BW_API_BASE}/${key}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) return null;
        const data = await res.json();
        return { key, name, data };
      })
    );

    const locations = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<{ key: string; name: string; data: unknown }>).value);

    return NextResponse.json({ locations }, {
      headers: { "Cache-Control": "public, max-age=1800" },
    });
  } catch {
    return NextResponse.json({ error: "Kunne ikke hente strømdata" }, { status: 500 });
  }
}
