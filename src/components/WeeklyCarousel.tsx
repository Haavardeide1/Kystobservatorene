"use client";

import { useEffect, useRef, useState } from "react";

type Submission = {
  id: string;
  media_type: "photo" | "video";
  media_url: string | null;
  display_name: string | null;
  created_at: string;
};

function getWeekBounds() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function Lightbox({ item, onClose }: { item: Submission; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm font-semibold"
        >
          Lukk ✕
        </button>

        {item.media_type === "photo" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.media_url!}
            alt={item.display_name || "Observasjon"}
            className="max-h-[85vh] w-full rounded-2xl object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            src={item.media_url!}
            controls
            autoPlay
            playsInline
            className="max-h-[85vh] w-full rounded-2xl bg-black"
          />
        )}

        {item.display_name && (
          <p className="mt-3 text-center text-sm text-white/60">
            {item.display_name}
          </p>
        )}
      </div>
    </div>
  );
}

export default function WeeklyCarousel() {
  const [items, setItems] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);

  useEffect(() => {
    fetch("/api/submissions/list")
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data) return;
        const { monday, sunday } = getWeekBounds();
        const weekItems = (data as Submission[]).filter((s) => {
          if (!s.media_url) return false;
          const d = new Date(s.created_at);
          return d >= monday && d <= sunday;
        });
        setItems(weekItems);
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <>
      <div className="mt-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Ukens bilder
        </p>
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((sub) =>
            sub.media_type === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={sub.id}
                src={sub.media_url!}
                alt={sub.display_name || "Observasjon"}
                className="h-28 w-28 shrink-0 cursor-pointer rounded-2xl object-cover shadow-md transition hover:opacity-90 hover:scale-105"
                onClick={() => setSelected(sub)}
              />
            ) : (
              <div
                key={sub.id}
                className="relative h-28 w-28 shrink-0 cursor-pointer overflow-hidden rounded-2xl bg-slate-800 shadow-md transition hover:opacity-90 hover:scale-105"
                onClick={() => setSelected(sub)}
              >
                <video
                  className="h-full w-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                >
                  <source src={sub.media_url!} type="video/mp4" />
                  <source src={sub.media_url!} type="video/quicktime" />
                </video>
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="text-lg text-white">▶</span>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {selected && <Lightbox item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
