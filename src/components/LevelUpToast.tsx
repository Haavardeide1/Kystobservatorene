"use client";

import { useEffect } from "react";
import type { LevelDef } from "@/lib/levels";

export default function LevelUpToast({
  level,
  onClose,
}: {
  level: LevelDef;
  onClose: () => void;
}) {
  // Auto-lukk etter 6 sekunder
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  // Escape-tast
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: level.bg, border: `2px solid ${level.color}30` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow-ring */}
        <div
          className="absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: level.color, opacity: 0.25 }}
        />

        <div className="relative px-8 pb-8 pt-10 text-center">
          {/* Nivå-badge */}
          <div
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-3xl font-black shadow-lg"
            style={{ background: level.color, color: "#fff" }}
          >
            {level.level}
          </div>

          <p
            className="text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: level.color }}
          >
            Nivå opp!
          </p>
          <h2
            className="mt-2 text-3xl font-black uppercase tracking-tight"
            style={{ color: "#0f172a" }}
          >
            {level.title}
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            Du har nådd nivå {level.level}. Fortsett å bidra for å låse opp enda høyere nivåer!
          </p>

          <a
            href="/profil"
            onClick={onClose}
            className="mt-6 block rounded-full py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
            style={{ background: level.color }}
          >
            Se profilen din →
          </a>
          <button
            onClick={onClose}
            className="mt-3 block w-full text-xs text-slate-400 transition hover:text-slate-600"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
}
