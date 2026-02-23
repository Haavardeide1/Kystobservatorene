"use client";

import { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/site/SiteHeader";
import { supabase } from "@/lib/supabase";

type Mode = "photo" | "video" | null;

type Message = {
  type: "success" | "error";
  text: string;
};

export default function ObservasjonerPage() {
  const [mode, setMode] = useState<Mode>(null);
  const [displayName, setDisplayName] = useState("");
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locationMethod, setLocationMethod] = useState<string | null>(null);
  const [seaState, setSeaState] = useState("");
  const [windDir, setWindDir] = useState("");
  const [waveDir, setWaveDir] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const title = useMemo(() => {
    if (mode === "photo") return "Last opp bilde og velg posisjon";
    if (mode === "video") return "Last opp video og velg posisjon";
    return "Velg type observasjon";
  }, [mode]);

  useEffect(() => {
    let isMounted = true;

    async function loadUserName() {
      const { data } = await supabase.auth.getUser();
      const meta = data.user?.user_metadata?.username as string | undefined;
      if (isMounted) setUserName(meta ?? null);
    }

    loadUserName();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      loadUserName();
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  function resetForm() {
    setDisplayName("");
    setComment("");
    setFile(null);
    setLat("");
    setLng("");
    setLocationMethod(null);
    setSeaState("");
    setWindDir("");
    setWaveDir("");
    setConsent(false);
  }

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      setMessage({ type: "error", text: "Geolokasjon er ikke tilgjengelig." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocationMethod("gps");
      },
      () => {
        setMessage({ type: "error", text: "Kunne ikke hente posisjon." });
      }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!mode) {
      setMessage({ type: "error", text: "Velg bilde eller video først." });
      return;
    }
    if (!file) {
      setMessage({ type: "error", text: "Velg en fil før du sender inn." });
      return;
    }
    if (!lat || !lng) {
      setMessage({ type: "error", text: "Legg inn posisjon før innsending." });
      return;
    }
    if (!consent) {
      setMessage({ type: "error", text: "Du må bekrefte personvernerklæringen." });
      return;
    }

    setSubmitting(true);

    try {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const safeName = file.name.replace(/\s+/g, "-");
      const path = `submissions/${id}/${safeName}`;

      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, contentType: file.type }),
      });

      if (!signRes.ok) {
        const err = await signRes.json();
        throw new Error(err.error || "Kunne ikke starte opplasting.");
      }

      const { uploadUrl } = await signRes.json();
      if (!uploadUrl) {
        throw new Error("Mangler opplastings-URL.");
      }

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Kunne ikke laste opp filen.");
      }

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const submissionPayload = {
        level: mode === "photo" ? 1 : 2,
        media_type: mode,
        media_path_original: path,
        display_name: userName || displayName || null,
        comment: comment || null,
        valg: seaState || null,
        wind_dir: windDir || null,
        wave_dir: waveDir || null,
        lat: Number(lat),
        lng: Number(lng),
        location_method: locationMethod || null,
        is_public: true,
      };

      const submitRes = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(submissionPayload),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json();
        throw new Error(err.error || "Kunne ikke lagre innsending.");
      }

      setMessage({ type: "success", text: "Takk! Innsendingen er registrert." });
      resetForm();
      setMode(null);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Noe gikk galt.",
      });
    } finally {
      setSubmitting(false);
    }
  }

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
              onClick={() => {
                setMode("photo");
                setFile(null);
              }}
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
              onClick={() => {
                setMode("video");
                setFile(null);
              }}
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
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                {!userName && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Navn (valgfritt)
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="F.eks. Ola Nordmann"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#1d5fa7]"
                    />
                  </div>
                )}

                {mode === "video" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Kommentar (valgfritt)
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Kort beskrivelse..."
                      className="min-h-[90px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#1d5fa7]"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {mode === "photo" ? "Bilde" : "Video"}
                  </label>
                  <input
                    type="file"
                    accept={mode === "photo" ? "image/*" : "video/*"}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  />
                  <p className="text-xs text-slate-400">
                    Maks 50 MB. Mobil kan bruke kamera direkte.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Hvor tok du {mode === "video" ? "videoen" : "bildet"}?
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleUseLocation}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                    >
                      📍 Bruk min posisjon
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                    >
                      🗺️ Velg på kart (kommer)
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input
                      type="number"
                      step="0.000001"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="Breddegrad"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      step="0.000001"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      placeholder="Lengdegrad"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {mode === "video" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Hva beskriver best havflaten?
                      </label>
                      <select
                        value={seaState}
                        onChange={(e) => setSeaState(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 outline-none"
                      >
                        <option value="">Velg...</option>
                        <option value="rolig">Rolig sjø</option>
                        <option value="lett">Lett bølger</option>
                        <option value="kraftig">Kraftige bølger</option>
                      </select>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-sm font-semibold text-slate-700">
                          Vindretning
                        </p>
                        <select
                          value={windDir}
                          onChange={(e) => setWindDir(e.target.value)}
                          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        >
                          <option value="">Velg...</option>
                          <option value="n">Nord</option>
                          <option value="ne">Nordøst</option>
                          <option value="e">Øst</option>
                          <option value="se">Sørøst</option>
                          <option value="s">Sør</option>
                          <option value="sw">Sørvest</option>
                          <option value="w">Vest</option>
                          <option value="nw">Nordvest</option>
                        </select>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-sm font-semibold text-slate-700">
                          Bølgeretning
                        </p>
                        <select
                          value={waveDir}
                          onChange={(e) => setWaveDir(e.target.value)}
                          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        >
                          <option value="">Velg...</option>
                          <option value="n">Nord</option>
                          <option value="ne">Nordøst</option>
                          <option value="e">Øst</option>
                          <option value="se">Sørøst</option>
                          <option value="s">Sør</option>
                          <option value="sw">Sørvest</option>
                          <option value="w">Vest</option>
                          <option value="nw">Nordvest</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Jeg bekrefter at jeg har lest og forstått personvernerklæringen.
                </label>

                {message && (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      message.type === "success"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  <a
                    href="/"
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
                  >
                    ← Tilbake
                  </a>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-[#0b1b36] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {submitting ? "Sender..." : "Send inn"}
                  </button>
                </div>
              </form>
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
