import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  try {
    const { password } = await req.json();
    if (!password || password !== adminPassword) {
      return NextResponse.json({ error: "Feil passord" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
