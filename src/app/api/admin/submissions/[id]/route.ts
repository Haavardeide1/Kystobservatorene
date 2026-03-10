import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyAdminRequest } from "@/lib/adminAuth";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { error } = await supabaseAdmin
      .from("submissions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { researcher_comment, researcher_name } = body as {
      researcher_comment: string | null;
      researcher_name: string;
    };

    const { error } = await supabaseAdmin
      .from("submissions")
      .update({
        researcher_comment: researcher_comment || null,
        researcher_name: researcher_comment ? (researcher_name || "NORCE-forsker") : null,
        researcher_commented_at: researcher_comment ? new Date().toISOString() : null,
      })
      .eq("id", params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
