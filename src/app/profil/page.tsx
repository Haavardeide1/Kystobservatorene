"use client";

import { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/site/SiteHeader";
import { supabase } from "@/lib/supabase";

type Badge = {
  title: string;
  progress: string;
  accent: string;
  status: "locked" | "active" | "earned";
};

const BADGES: Badge[] = [
  { title: "Registrert", progress: "1/1", accent: "#2bb673", status: "earned" },
  { title: "Første bølge", progress: "0/1", accent: "#6ba8ff", status: "active" },
  { title: "Fotograf", progress: "0/5", accent: "#f6b24d", status: "active" },
  { title: "Videograf", progress: "0/5", accent: "#7b6cff", status: "locked" },
  { title: "Heat streak", progress: "0/3 dager", accent: "#ff6b6b", status: "locked" },
  { title: "Utforsker", progress: "0/5 steder", accent: "#36c9c6", status: "locked" },
  { title: "Stormjeger", progress: "0/1", accent: "#9aa4b2", status: "locked" },
  { title: "Stigende stjerne", progress: "0/10", accent: "#f2c94c", status: "locked" },
  { title: "Legende", progress: "0/50", accent: "#d9b56d", status: "locked" },
];

export default function ProfilPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isLoggedIn = Boolean(email);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      const user = data.user;
      setEmail(user?.email ?? null);
      const stored = (user?.user_metadata?.username as string | undefined) ?? null;
      setUsername(stored);
      setInputValue(stored ?? "");
    }

    loadUser();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const initials = useMemo(() => {
    if (username) return username.slice(0, 1).toUpperCase();
    if (email) return email.slice(0, 1).toUpperCase();
    return "?";
  }, [username, email]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!inputValue.trim()) {
      setMessage("Skriv inn et brukernavn.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { username: inputValue.trim() },
    });
    if (error) {
      setMessage(error.message);
    } else {
      setUsername(inputValue.trim());
      setMessage("Brukernavn lagret.");
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-[#eef2f7] text-slate-900">
      <SiteHeader variant="light" />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-12">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Profil
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-slate-900">
            Din side
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600 md:text-lg">
            Her finner du dine merker, statistikk og fremdrift. Første gang du
            logger inn kan du velge brukernavn.
          </p>
        </div>

        <section className="rounded-[28px] bg-white p-6 shadow-xl md:p-10">
          {!isLoggedIn && (
            <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Du må være logget inn for å se profilen din.{" "}
              <a className="font-semibold underline" href="/login">
                Logg inn her
              </a>
              .
            </div>
          )}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1d5fa7] text-2xl font-semibold text-white">
              {initials}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">
                {username ?? "Velkommen"}
              </h2>
              <p className="text-sm text-slate-500">{email ?? ""}</p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Aktiv medlem
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Brukernavn
              </p>
              <h3 className="mt-3 text-lg font-semibold text-slate-800">
                {username ? "Endre brukernavn" : "Velg brukernavn"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Dette vises på offentlige bidrag og i kartet. Kun første gang du
                logger inn må du sette et brukernavn.
              </p>

              <form onSubmit={handleSave} className="mt-4 flex flex-col gap-3">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={!isLoggedIn}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1d5fa7]"
                  placeholder="Skriv inn ønsket brukernavn"
                />
                <button
                  type="submit"
                  disabled={saving || !isLoggedIn}
                  className="rounded-xl bg-[#0b1b36] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Lagrer..." : "Lagre brukernavn"}
                </button>
              </form>
              {message && (
                <p className="mt-3 text-sm text-slate-600">{message}</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Dine statistikker
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Observasjoner", value: "0" },
                  { label: "Merker opptjent", value: "1" },
                  { label: "Steder", value: "0" },
                  { label: "Streak", value: "0 dager" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-[#f6f7fb] px-5 py-4 text-center"
                  >
                    <div className="text-2xl font-semibold text-slate-900">
                      {stat.value}
                    </div>
                    <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[28px] bg-white p-6 shadow-xl md:p-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Merker
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                Fremdrift og belønninger
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Oppdateres når du sender inn
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BADGES.map((badge) => (
              <div
                key={badge.title}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg"
                  style={{ backgroundColor: `${badge.accent}1f` }}
                >
                  {badge.status === "earned" ? "✅" : "🏅"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {badge.title}
                  </p>
                  <p className="text-xs text-slate-400">{badge.progress}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                    badge.status === "earned"
                      ? "bg-emerald-50 text-emerald-600"
                      : badge.status === "active"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {badge.status === "earned"
                    ? "Oppnådd"
                    : badge.status === "active"
                    ? "I gang"
                    : "Låst"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
