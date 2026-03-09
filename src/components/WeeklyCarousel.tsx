"use client";

import { useEffect, useState } from "react";

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

export default function WeeklyCarousel() {
  const [items, setItems] = useState<Submission[]>([]);

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

  // Tripler for å sikre sømløs loop uansett antall
  const track = [...items, ...items, ...items];
  const duration = Math.max(items.length * 5, 20);

  return (
    <section className="overflow-hidden border-t border-slate-100 bg-white py-8">
      <style>{`
        @keyframes ky-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
        .ky-track {
          display: flex;
          gap: 12px;
          width: max-content;
          animation: ky-scroll ${duration}s linear infinite;
        }
        .ky-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="mx-auto mb-4 w-full max-w-6xl px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Ukens bilder
        </p>
      </div>

      <div className="ky-track">
        {track.map((sub, i) =>
          sub.media_type === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${sub.id}-${i}`}
              src={sub.media_url!}
              alt={sub.display_name || "Observasjon"}
              className="h-32 w-32 shrink-0 rounded-2xl object-cover shadow-md"
            />
          ) : (
            <div
              key={`${sub.id}-${i}`}
              className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-slate-800 shadow-md"
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
    </section>
  );
}
