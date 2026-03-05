import { supabaseAdmin } from "./supabaseAdmin";

// Permanent super-admin — always has access regardless of metadata
export const SUPER_ADMIN_EMAILS = ["haavardeide1@gmail.com"];

type AuthResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * Verifies that the incoming request carries a valid Supabase JWT
 * belonging to a super-admin email OR a user with is_admin: true in metadata.
 */
export async function verifyAdminRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { ok: false, status: 401, error: "Invalid token" };
  }

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user.email ?? "");
  const isMetaAdmin = user.user_metadata?.is_admin === true;

  if (!isSuperAdmin && !isMetaAdmin) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true };
}
