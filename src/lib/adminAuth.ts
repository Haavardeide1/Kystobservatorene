import { supabaseAdmin } from "./supabaseAdmin";

const ADMIN_EMAILS = ["haavardeide1@gmail.com"];

type AuthResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * Verifies that the incoming request carries a valid Supabase JWT
 * belonging to one of the allowed admin emails.
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
  if (!ADMIN_EMAILS.includes(user.email ?? "")) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true };
}
