"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AuthMode = "signin" | "signup" | "forgot";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const passwordRules = [
    { label: "Minst 8 tegn", ok: password.length >= 8 },
    { label: "Minst én stor bokstav", ok: /[A-Z]/.test(password) },
    { label: "Minst ett tall", ok: /[0-9]/.test(password) },
  ];
  const passwordValid = passwordRules.every((r) => r.ok);

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
    setIsError(false);
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage("Sjekk e-posten din for en lenke til å tilbakestille passordet.");
      } else if (mode === "signup") {
        if (!passwordValid) {
          setIsError(true);
          setMessage("Passordet oppfyller ikke kravene.");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Sjekk e-posten din for bekreftelse før du logger inn.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      setIsError(true);
      if (err instanceof Error && err.message.toLowerCase().includes("invalid login")) {
        setMessage("Feil brukernavn eller passord.");
      } else if (err instanceof Error) {
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
          </div>

          {mode !== "forgot" && (
            <div className="mb-6 flex gap-2">
              <button
                type="button"
                onClick={() => { setMode("signin"); setMessage(null); }}
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
                onClick={() => { setMode("signup"); setMessage(null); }}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === "signup"
                    ? "bg-white text-slate-950"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Opprett konto
              </button>
            </div>
          )}

          {mode === "forgot" && (
            <p className="mb-6 text-sm text-white/60">
              Skriv inn e-postadressen din så sender vi deg en lenke for å tilbakestille passordet.
            </p>
          )}

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
            {mode !== "forgot" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Passord</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-white/40 focus:border-white/30"
                  placeholder="Passord"
                />
                {mode === "signup" && password.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {passwordRules.map((r) => (
                      <li key={r.label} className={`flex items-center gap-2 text-xs ${r.ok ? "text-emerald-400" : "text-white/40"}`}>
                        <span>{r.ok ? "✓" : "○"}</span>
                        {r.label}
                      </li>
                    ))}
                  </ul>
                )}
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setMessage(null); }}
                    className="mt-2 text-xs text-white/40 hover:text-white/70 transition"
                  >
                    Glemt passord?
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? "Jobber..." : mode === "signup" ? "Opprett konto" : mode === "forgot" ? "Send tilbakestillingslenke" : "Logg inn"}
            </button>

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => { setMode("signin"); setMessage(null); }}
                className="w-full text-center text-sm text-white/40 hover:text-white/70 transition"
              >
                Tilbake til innlogging
              </button>
            )}
          </form>

          {message && (
            <p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              isError
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            }`}>
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
