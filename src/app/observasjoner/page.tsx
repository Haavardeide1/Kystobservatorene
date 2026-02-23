"use client";

import { useMemo, useState } from "react";
import SiteHeader from "@/components/site/SiteHeader";

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
      <SiteHeader variant="dark" />

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

            {mode ? (
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
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Velg først om du vil sende inn bilde eller video.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}


