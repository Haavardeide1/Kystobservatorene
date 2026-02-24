"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/site/SiteHeader";

const ADMIN_EMAILS = ["haavardeide1@gmail.com"];

type Submission = {
  id: string;
  user_id: string | null;
  user_email: string | null;
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

type AppUser = {
  id: string;
  email: string | null;
  username: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

type Step = "checking" | "not-admin" | "needs-password" | "dashboard";
type Tab = "innsendinger" | "tilganger";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function downloadBlob(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function AdminPage() {
  const [step, setStep] = useState<Step>("checking");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("innsendinger");

  // Password gate
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Submissions
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Detail modal
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  // Download all
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Users
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ── Auth check ────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email ?? null;
      const token = data.session?.access_token ?? null;
      setUserEmail(email);
      setAccessToken(token);

      if (email && ADMIN_EMAILS.includes(email)) {
        if (sessionStorage.getItem("admin_verified") === "true") {
          setStep("dashboard");
          fetchSubmissions(token);
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
        fetchSubmissions(accessToken);
      } else {
        setPasswordError("Feil passord. Prøv igjen.");
      }
    } catch {
      setPasswordError("Noe gikk galt. Prøv igjen.");
    } finally {
      setPasswordLoading(false);
    }
  }

  // ── Fetch data ────────────────────────────────────────────────────────────

  async function fetchSubmissions(token: string | null) {
    if (!token) return;
    setLoadingData(true);
    try {
      const res = await fetch("/api/admin/submissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data } = await res.json();
      setSubmissions(data ?? []);
    } finally {
      setLoadingData(false);
    }
  }

  async function fetchUsers() {
    if (!accessToken) return;
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { data } = await res.json();
      setUsers(data ?? []);
    } finally {
      setLoadingUsers(false);
    }
  }

  function handleTabChange(t: Tab) {
    setTab(t);
    if (t === "tilganger" && users.length === 0) fetchUsers();
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    if (!accessToken) return;
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  // ── CSV export ────────────────────────────────────────────────────────────

  function exportCSV() {
    const headers = [
      "id", "created_at", "display_name", "media_type", "level",
      "lat_public", "lng_public", "comment", "valg", "wind_dir",
      "wave_dir", "is_public", "media_url",
    ];
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = submissions.map((s) =>
      [
        s.id, s.created_at, s.display_name ?? "", s.media_type, s.level,
        s.lat_public ?? "", s.lng_public ?? "", s.comment ?? "",
        s.valg ?? "", s.wind_dir ?? "", s.wave_dir ?? "",
        s.is_public, s.media_url ?? "",
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

  // ── Download single ───────────────────────────────────────────────────────

  async function handleDownloadOne(sub: Submission) {
    if (!sub.media_url) return;
    setDownloadingId(sub.id);
    try {
      const ext = sub.media_type === "photo" ? "jpg" : "mp4";
      const name = `${sub.display_name ?? "observasjon"}-${sub.id.slice(0, 8)}.${ext}`;
      await downloadBlob(sub.media_url, name);
    } finally {
      setDownloadingId(null);
    }
  }

  // ── Download all (ZIP) ────────────────────────────────────────────────────

  async function handleDownloadAll() {
    const withMedia = submissions.filter((s) => s.media_url);
    if (withMedia.length === 0) return;

    setDownloadingAll(true);
    setDownloadProgress(0);

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const folder = zip.folder("kystobservatorene") ?? zip;

      for (let i = 0; i < withMedia.length; i++) {
        const sub = withMedia[i];
        setDownloadProgress(Math.round((i / withMedia.length) * 80));
        try {
          const res = await fetch(sub.media_url!);
          const blob = await res.blob();
          const ext = sub.media_type === "photo" ? "jpg" : "mp4";
          const name = `${String(i + 1).padStart(3, "0")}-${sub.display_name ?? "anonym"}-${sub.id.slice(0, 8)}.${ext}`;
          folder.file(name, blob);
        } catch {
          // skip failed files
        }
      }

      setDownloadProgress(85);
      const zipBlob = await zip.generateAsync({ type: "blob" }, (meta) => {
        setDownloadProgress(85 + Math.round(meta.percent * 0.15));
      });

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kystobservatorene-${new Date().toISOString().split("T")[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingAll(false);
      setDownloadProgress(0);
    }
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

  // ── Gate screens ──────────────────────────────────────────────────────────

  if (step === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b2f]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (step === "not-admin") {
    return (
      <div className="min-h-screen bg-[#070b2f] text-white">
        <SiteHeader variant="dark" />
        <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="text-5xl">🔒</div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Ingen tilgang</h1>
          <p className="text-sm text-white/50">
            {userEmail ? `${userEmail} har ikke admin-tilgang.` : "Du må logge inn med en admin-konto."}
          </p>
          <a href="/login" className="mt-4 rounded-full border border-white/30 px-6 py-2.5 text-sm font-semibold transition hover:bg-white/10">
            Logg inn
          </a>
        </div>
      </div>
    );
  }

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
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-500/60"
              />
              {passwordError && <p className="text-sm text-rose-400">{passwordError}</p>}
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

  // ── Dashboard ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader variant="light" />

      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Kystobservatørene</p>
            <h1 className="mt-0.5 text-2xl font-black uppercase tracking-tight text-[#070b2f]">Admin-panel</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportCSV}
              disabled={submissions.length === 0}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              📄 Eksporter CSV
            </button>
            <button
              onClick={handleDownloadAll}
              disabled={downloadingAll || submissions.filter((s) => s.media_url).length === 0}
              className="flex items-center gap-2 rounded-xl bg-[#070b2f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f2744] disabled:opacity-50"
            >
              {downloadingAll ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {downloadProgress}%
                </>
              ) : (
                "⬇ Last ned alle (ZIP)"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
          {(["innsendinger", "tilganger"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize transition ${
                tab === t
                  ? "bg-[#070b2f] text-white shadow"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t === "innsendinger" ? "Innsendinger" : "Tilganger"}
            </button>
          ))}
        </div>

        {/* ── TAB: Innsendinger ── */}
        {tab === "innsendinger" && (
          <>
            {/* Stats */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              {[
                { label: "Totalt", value: submissions.length },
                { label: "Bilder", value: photoCount },
                { label: "Videoer", value: videoCount },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <div className="text-2xl font-black text-[#070b2f]">{s.value}</div>
                  <div className="mt-0.5 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{s.label}</div>
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
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Handlinger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((sub) => (
                        <tr
                          key={sub.id}
                          className="cursor-pointer transition hover:bg-blue-50"
                          onClick={() => setSelectedSub(sub)}
                        >
                          {/* Thumbnail */}
                          <td className="px-4 py-3">
                            {sub.media_url ? (
                              sub.media_type === "photo" ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={sub.media_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xl">🎥</div>
                              )
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-slate-100" />
                            )}
                          </td>

                          {/* Name */}
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {sub.display_name || <span className="text-slate-400">Anonym</span>}
                          </td>

                          {/* Type badge */}
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              sub.media_type === "photo" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                            }`}>
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
                          <td className="max-w-[160px] px-4 py-3 text-xs text-slate-500">
                            <span className="line-clamp-2">{sub.comment || <span className="text-slate-300">—</span>}</span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              {/* Download */}
                              <button
                                onClick={() => handleDownloadOne(sub)}
                                disabled={!sub.media_url || downloadingId === sub.id}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                                title="Last ned"
                              >
                                {downloadingId === sub.id ? "…" : "⬇"}
                              </button>

                              {/* Delete */}
                              {confirmDeleteId === sub.id ? (
                                <>
                                  <button
                                    onClick={() => handleDelete(sub.id)}
                                    disabled={deletingId === sub.id}
                                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                                  >
                                    {deletingId === sub.id ? "…" : "Bekreft"}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                  >
                                    Avbryt
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(sub.id)}
                                  className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                                >
                                  Slett
                                </button>
                              )}
                            </div>
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

            {/* ── Detail modal ── */}
            {selectedSub && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                onClick={() => setSelectedSub(null)}
              >
                <div
                  className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Media preview */}
                  {selectedSub.media_url && (
                    selectedSub.media_type === "photo" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedSub.media_url}
                        alt=""
                        className="max-h-64 w-full object-cover"
                      />
                    ) : (
                      <video
                        src={selectedSub.media_url}
                        controls
                        playsInline
                        preload="metadata"
                        className="max-h-64 w-full bg-black object-contain"
                      />
                    )
                  )}

                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {selectedSub.display_name || "Anonym"}
                        </h3>
                        <p className="text-xs text-slate-400">{formatDate(selectedSub.created_at)}</p>
                      </div>
                      <button
                        onClick={() => setSelectedSub(null)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Details grid */}
                    <div className="space-y-2 text-sm">
                      {[
                        { label: "Bruker-ID", value: selectedSub.user_id || "Anonym (ikke innlogget)" },
                        { label: "E-post", value: selectedSub.user_email || "—" },
                        { label: "Type", value: selectedSub.media_type === "photo" ? "📸 Bilde" : "🎥 Video" },
                        {
                          label: "Koordinater",
                          value: selectedSub.lat_public && selectedSub.lng_public
                            ? `${selectedSub.lat_public.toFixed(5)}, ${selectedSub.lng_public.toFixed(5)}`
                            : "—",
                          link: selectedSub.lat_public && selectedSub.lng_public
                            ? `https://www.google.com/maps?q=${selectedSub.lat_public},${selectedSub.lng_public}`
                            : null,
                        },
                        { label: "Havtilstand", value: selectedSub.valg || "—" },
                        { label: "Vindretning", value: selectedSub.wind_dir || "—" },
                        { label: "Bølgeretning", value: selectedSub.wave_dir || "—" },
                        { label: "Kommentar", value: selectedSub.comment || "—" },
                        { label: "Offentlig", value: selectedSub.is_public ? "Ja" : "Nei" },
                      ].map(({ label, value, link }) => (
                        <div key={label} className="flex gap-3 rounded-lg bg-slate-50 px-3 py-2">
                          <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {label}
                          </span>
                          {link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-blue-600 hover:underline"
                            >
                              {value}
                            </a>
                          ) : (
                            <span className="break-all font-mono text-xs text-slate-700">{value}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex gap-2">
                      {selectedSub.media_url && (
                        <button
                          onClick={() => handleDownloadOne(selectedSub)}
                          className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          ⬇ Last ned
                        </button>
                      )}
                      {confirmDeleteId === selectedSub.id ? (
                        <>
                          <button
                            onClick={() => { handleDelete(selectedSub.id); setSelectedSub(null); }}
                            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
                          >
                            Bekreft sletting
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            Avbryt
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(selectedSub.id)}
                          className="flex-1 rounded-xl border border-rose-200 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          🗑 Slett observasjon
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── TAB: Tilganger ── */}
        {tab === "tilganger" && (
          <div className="space-y-8">

            {/* Admin-tilganger */}
            <div>
              <h2 className="mb-4 text-lg font-bold text-[#070b2f]">Admin-tilganger</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">E-post</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Rolle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ADMIN_EMAILS.map((email) => (
                      <tr key={email} className="border-b border-slate-100 last:border-0">
                        <td className="px-5 py-3 font-medium text-slate-800">{email}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            🛡️ Admin
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alle brukere */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#070b2f]">
                  Alle brukere
                  {!loadingUsers && users.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-slate-400">({users.length})</span>
                  )}
                </h2>
                <button
                  onClick={fetchUsers}
                  className="text-xs font-semibold text-blue-600 transition hover:underline"
                >
                  Oppdater
                </button>
              </div>

              {loadingUsers ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-left">
                          <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">E-post</th>
                          <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Brukernavn</th>
                          <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Registrert</th>
                          <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Siste innlogging</th>
                          <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Rolle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="px-5 py-3 font-medium text-slate-800">{u.email ?? "—"}</td>
                            <td className="px-5 py-3 text-slate-500">{u.username ?? <span className="text-slate-300">—</span>}</td>
                            <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">
                              {formatDate(u.created_at)}
                            </td>
                            <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">
                              {u.last_sign_in_at ? formatDate(u.last_sign_in_at) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-5 py-3">
                              {ADMIN_EMAILS.includes(u.email ?? "") ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                  🛡️ Admin
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                                  Bruker
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
