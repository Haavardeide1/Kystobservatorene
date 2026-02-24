"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/site/SiteHeader";

const ADMIN_EMAILS = ["haavardeide1@gmail.com"];

type Submission = {
  id: string;
  user_id: string | null;
  display_name: string | null;
  media_type: "photo" | "video";
  media_url: string | null;
  lat_public: number | null;
  lng_public: number | null;
  created_at: string;
  comment: string | null;
  valg: string | null;
  wind_dir: string | null;
  wave_dir: string | null;
  level: number;
  is_public: boolean;
};

type Step = "checking" | "not-admin" | "needs-password" | "dashboard";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const [step, setStep] = useState<Step>("checking");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Check auth ────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? null;
      setUserEmail(email);
      if (email && ADMIN_EMAILS.includes(email)) {
        if (sessionStorage.getItem("admin_verified") === "true") {
          setStep("dashboard");
          fetchSubmissions();
        } else {
          setStep("needs-password");
        }
      } else {
        setStep("not-admin");
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Password verify ───────────────────────────────────────────────────────

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem("admin_verified", "true");
        setStep("dashboard");
        fetchSubmissions();
      } else {
        setPasswordError("Feil passord. Prøv igjen.");
      }
    } catch {
      setPasswordError("Noe gikk galt. Prøv igjen.");
    } finally {
      setPasswordLoading(false);
    }
  }

  // ── Fetch submissions ─────────────────────────────────────────────────────

  async function fetchSubmissions() {
    setLoadingData(true);
    try {
      const res = await fetch("/api/admin/submissions");
      const { data } = await res.json();
      setSubmissions(data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoadingData(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  // ── CSV export ────────────────────────────────────────────────────────────

  function exportCSV() {
    const headers = [
      "id",
      "created_at",
      "display_name",
      "media_type",
      "level",
      "lat_public",
      "lng_public",
      "comment",
      "valg",
      "wind_dir",
      "wave_dir",
      "is_public",
      "media_url",
    ];

    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    const rows = submissions.map((s) =>
      [
        s.id,
        s.created_at,
        s.display_name ?? "",
        s.media_type,
        s.level,
        s.lat_public ?? "",
        s.lng_public ?? "",
        s.comment ?? "",
        s.valg ?? "",
        s.wind_dir ?? "",
        s.wave_dir ?? "",
        s.is_public,
        s.media_url ?? "",
      ].map(escape).join(",")
    );

    const csv = [headers.map(escape).join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kystobservatorene-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.display_name ?? "").toLowerCase().includes(q) ||
      (s.comment ?? "").toLowerCase().includes(q) ||
      s.media_type.includes(q)
    );
  });

  const photoCount = submissions.filter((s) => s.media_type === "photo").length;
  const videoCount = submissions.filter((s) => s.media_type === "video").length;

  // ── Render: checking ──────────────────────────────────────────────────────

  if (step === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b2f]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  // ── Render: not admin ─────────────────────────────────────────────────────

  if (step === "not-admin") {
    return (
      <div className="min-h-screen bg-[#070b2f] text-white">
        <SiteHeader variant="dark" />
        <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="text-5xl">🔒</div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Ingen tilgang</h1>
          <p className="text-sm text-white/50">
            {userEmail
              ? `${userEmail} har ikke admin-tilgang.`
              : "Du må logge inn med en admin-konto."}
          </p>
          <a
            href="/login"
            className="mt-4 rounded-full border border-white/30 px-6 py-2.5 text-sm font-semibold transition hover:bg-white/10"
          >
            Logg inn
          </a>
        </div>
      </div>
    );
  }

  // ── Render: needs password ────────────────────────────────────────────────

  if (step === "needs-password") {
    return (
      <div className="min-h-screen bg-[#070b2f] text-white">
        <SiteHeader variant="dark" />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-6">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <div className="mb-4 text-4xl">🛡️</div>
              <h1 className="text-2xl font-black uppercase tracking-tight">Admin-tilgang</h1>
              <p className="mt-2 text-sm text-white/50">
                Logget inn som <span className="text-white/80">{userEmail}</span>
              </p>
              <p className="mt-1 text-sm text-white/40">Skriv inn admin-passordet for å fortsette.</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin-passord"
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
              />
              {passwordError && (
                <p className="text-sm text-rose-400">{passwordError}</p>
              )}
              <button
                type="submit"
                disabled={passwordLoading || !password}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {passwordLoading ? "Verifiserer…" : "Logg inn som admin"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: dashboard ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader variant="light" />

      {/* Header bar */}
      <div className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Kystobservatørene
            </p>
            <h1 className="mt-0.5 text-2xl font-black uppercase tracking-tight text-[#070b2f]">
              Admin-panel
            </h1>
          </div>
          <button
            onClick={exportCSV}
            disabled={submissions.length === 0}
            className="flex items-center gap-2 rounded-xl bg-[#070b2f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f2744] disabled:opacity-40"
          >
            ⬇ Eksporter CSV
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "Totalt", value: submissions.length },
            { label: "Bilder", value: photoCount },
            { label: "Videoer", value: videoCount },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="text-2xl font-black text-[#070b2f]">{s.value}</div>
              <div className="mt-0.5 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk etter navn, kommentar, type…"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 md:max-w-sm"
          />
        </div>

        {/* Table */}
        {loadingData ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
            <p className="text-slate-400">Ingen observasjoner funnet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Media</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Navn</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Koordinater</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Dato</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Kommentar</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((sub) => (
                    <tr key={sub.id} className="transition hover:bg-slate-50">
                      {/* Thumbnail */}
                      <td className="px-4 py-3">
                        {sub.media_url ? (
                          sub.media_type === "photo" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={sub.media_url}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xl">
                              🎥
                            </div>
                          )
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-slate-100" />
                        )}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {sub.display_name || <span className="text-slate-400">Anonym</span>}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            sub.media_type === "photo"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {sub.media_type === "photo" ? "📸 Bilde" : "🎥 Video"}
                        </span>
                      </td>

                      {/* Coordinates */}
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {sub.lat_public && sub.lng_public ? (
                          <a
                            href={`https://www.google.com/maps?q=${sub.lat_public},${sub.lng_public}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {sub.lat_public.toFixed(4)}, {sub.lng_public.toFixed(4)}
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {formatDate(sub.created_at)}
                      </td>

                      {/* Comment */}
                      <td className="max-w-[180px] px-4 py-3 text-xs text-slate-500">
                        <span className="line-clamp-2">
                          {sub.comment || <span className="text-slate-300">—</span>}
                        </span>
                      </td>

                      {/* Delete */}
                      <td className="px-4 py-3">
                        {confirmDeleteId === sub.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDelete(sub.id)}
                              disabled={deletingId === sub.id}
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                            >
                              {deletingId === sub.id ? "Sletter…" : "Bekreft"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                              Avbryt
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(sub.id)}
                            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            Slett
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-400">
          {filtered.length} av {submissions.length} observasjoner · Innlogget som {userEmail}
        </p>
      </div>
    </div>
  );
}
