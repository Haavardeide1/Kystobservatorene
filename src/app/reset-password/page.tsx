"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const passwordRules = (password: string) => [
  { label: "Minst 8 tegn", ok: password.length >= 8 },
  { label: "Minst én stor bokstav", ok: /[A-Z]/.test(password) },
  { label: "Minst ett tall", ok: /[0-9]/.test(password) },
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const rules = passwordRules(password);
  const passwordValid = rules.every((r) => r.ok);

  // Supabase sender token i URL-hashen — vi må vente på at auth-tilstanden settes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsError(false);

    if (!passwordValid) {
      setIsError(true);
      setMessage("Passordet oppfyller ikke kravene.");
      return;
    }
    if (password !== confirm) {
      setIsError(true);
      setMessage("Passordene er ikke like.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Passordet er oppdatert. Du blir sendt til innlogging...");
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: unknown) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Noe gikk galt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-12">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">Nytt passord</h1>
            <p className="mt-2 text-sm text-white/60">Velg et nytt passord for kontoen din.</p>
          </div>

          {!ready ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
              Verifiserer lenke…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Nytt passord</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
                  placeholder="Nytt passord"
                />
                {password.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {rules.map((r) => (
                      <li key={r.label} className={`flex items-center gap-2 text-xs ${r.ok ? "text-emerald-400" : "text-white/40"}`}>
                        <span>{r.ok ? "✓" : "○"}</span>
                        {r.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Bekreft passord</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
                  placeholder="Gjenta passord"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:opacity-50"
              >
                {loading ? "Lagrer..." : "Sett nytt passord"}
              </button>
            </form>
          )}

          {message && (
            <p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              isError
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            }`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
