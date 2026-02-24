import { NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Fremje123";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Feil passord" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
