import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyAdminRequest, SUPER_ADMIN_EMAILS } from "@/lib/adminAuth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAdminRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { is_admin } = await req.json();

  // Prevent removing admin from super-admin accounts
  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(params.id);
  if (user?.email && SUPER_ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Kan ikke endre tilgang for super-admin" }, { status: 403 });
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(params.id, {
    user_metadata: { is_admin: Boolean(is_admin) },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
