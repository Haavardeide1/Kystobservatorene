"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // If already logged in, redirect immediately
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace(redirectTo);
      } else {
        setCheckingSession(false);
      }
    });
  }, [redirectTo, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Sjekk e-posten din for bekreftelse før du logger inn.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(err.message);
      } else {
        setMessage("Noe gikk galt.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-12">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">Logg inn</h1>
            <p className="mt-2 text-sm text-white/70">
              Bruk e-post og passord. Nye brukere må bekrefte e-postadressen sin.
            </p>
          </div>

          <div className="mb-6 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                mode === "signin"
                  ? "bg-white text-slate-950"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Logg inn
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-white text-slate-950"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Opprett konto
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">E-post</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-white/40 focus:border-white/30"
                placeholder="deg@eksempel.no"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Passord</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-white/40 focus:border-white/30"
                placeholder="Minst 6 tegn"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? "Jobber..." : mode === "signup" ? "Opprett konto" : "Logg inn"}
            </button>
          </form>

          {message && (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              {message}
            </p>
          )}

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-white/60 hover:text-white">
              Tilbake til forsiden
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
