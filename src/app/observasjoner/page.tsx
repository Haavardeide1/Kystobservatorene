"use client";

import { useMemo, useState } from "react";

type Mode = "photo" | "video" | null;

const photoFields = [
  { label: "Navn (valgfritt)", placeholder: "F.eks. Ola Nordmann" },
  { label: "Bilde", placeholder: "Velg fil" },
];

const videoFields = [
  { label: "Navn (valgfritt)", placeholder: "F.eks. Ola Nordmann" },
  { label: "Kommentar (valgfritt)", placeholder: "Kort beskrivelse..." },
];

export default function ObservasjonerPage() {
  const [mode, setMode] = useState<Mode>(null);

  const title = useMemo(() => {
    if (mode === "photo") return "Last opp bilde og velg posisjon";
    if (mode === "video") return "Last opp video og velg posisjon";
    return "Velg type observasjon";
  }, [mode]);

  return (
    <div className="min-h-screen bg-[#2b325e] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#23284f]/95 text-white backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <a
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.2em]"
          >
            Kystobservatørene
          </a>
          <nav className="flex items-center gap-6 text-sm">
            <a className="text-white/80 transition hover:text-white" href="#form">
              Send inn
            </a>
            <a
              className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
              href="/login"
            >
              Logg inn
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-12">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
            Send inn din observasjon
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-5xl">
            Send inn din observasjon
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/70 md:text-lg">
            Du trenger ikke bruker for å sende inn, men registrerte brukere kan
            følge bidrag, samle badges og se status på innsendingene sine.
          </p>
        </div>

        <section className="rounded-[32px] bg-white p-6 text-slate-900 shadow-2xl md:p-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <span className="text-lg">🗺️</span>
              <span>
                Bilder og videoer du sender inn vil automatisk vises på det
                offentlige kartet på nettsiden.
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <div className="flex items-center gap-3">
                <span className="text-lg">💡</span>
                <div>
                  <p className="font-semibold">Valgfritt:</p>
                  <p>Registrer deg for å spore dine bidrag og tjene badges</p>
                </div>
              </div>
              <a href="/login" className="font-semibold underline">
                Registrer deg
              </a>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-[#f6f7fb] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Profil og merker
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-800">
                  Dine statistikker
                </h2>
              </div>
              <a
                href="/login"
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600"
              >
                Logg inn for profil
              </a>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                { label: "Observasjoner", value: "0" },
                { label: "Merker opptjent", value: "1" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white px-6 py-6 text-center shadow-sm"
                >
                  <div className="text-3xl font-semibold text-slate-900">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Merker
                </h3>
                <span className="text-xs text-slate-400">
                  Forhåndsvisning
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { title: "Registrert", progress: "1/1", accent: "#2bb673" },
                  { title: "Første bølge", progress: "0/1", accent: "#6ba8ff" },
                  { title: "Fotograf", progress: "0/5", accent: "#f6b24d" },
                  { title: "Videograf", progress: "0/5", accent: "#7b6cff" },
                  { title: "Heat streak", progress: "0/3 dager", accent: "#ff6b6b" },
                  { title: "Utforsker", progress: "0/5 steder", accent: "#36c9c6" },
                  { title: "Stormjeger", progress: "0/1", accent: "#9aa4b2" },
                  { title: "Stigende stjerne", progress: "0/10", accent: "#f2c94c" },
                  { title: "Legende", progress: "0/50", accent: "#d9b56d" },
                ].map((badge) => (
                  <div
                    key={badge.title}
                    className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg"
                      style={{ backgroundColor: `${badge.accent}22` }}
                    >
                      🏅
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {badge.title}
                      </p>
                      <p className="text-xs text-slate-400">{badge.progress}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("photo")}
              className={`flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-3xl border px-6 py-6 text-center transition ${
                mode === "photo"
                  ? "border-[#1d5fa7] bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="text-3xl">📸</span>
              <span className="text-base font-semibold">Bilde</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("video")}
              className={`flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-3xl border px-6 py-6 text-center transition ${
                mode === "video"
                  ? "border-[#1d5fa7] bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="text-3xl">🎥</span>
              <span className="text-base font-semibold">Video</span>
            </button>
          </div>

          <div id="form" className="mt-10">
            <h2 className="text-lg font-semibold uppercase tracking-wide text-slate-800">
              {title}
            </h2>

            <div className="mt-6 space-y-5">
              {(mode === "photo" ? photoFields : videoFields).map((field) => (
                <div key={field.label} className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#1d5fa7]"
                  />
                </div>
              ))}

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Hvor tok du {mode === "video" ? "videoen" : "bildet"}?
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
                    📍 Bruk min posisjon
                  </button>
                  <button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
                    🗺️ Velg på kart
                  </button>
                </div>
              </div>

              {mode === "video" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Hva beskriver best havflaten?
                    </label>
                    <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 outline-none">
                      <option>Velg...</option>
                      <option>Rolig sjø</option>
                      <option>Lett bølger</option>
                      <option>Kraftige bølger</option>
                    </select>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-700">
                        Vindretning
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                          🧭 Bruk kompass
                        </button>
                        <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                          -
                        </button>
                      </div>
                      <select className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                        <option>Eller velg manuelt...</option>
                      </select>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-700">
                        Bølgeretning
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                          🧭 Bruk kompass
                        </button>
                        <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                          -
                        </button>
                      </div>
                      <select className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                        <option>Eller velg manuelt...</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <input type="checkbox" className="h-4 w-4" />
                Jeg bekrefter at jeg har lest og forstått personvernerklæringen.
              </label>

              <div className="flex flex-wrap gap-4">
                <a
                  href="/"
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
                >
                  ← Tilbake
                </a>
                <button className="flex-1 rounded-xl bg-[#0b1b36] px-6 py-3 text-sm font-semibold text-white">
                  Send inn
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
