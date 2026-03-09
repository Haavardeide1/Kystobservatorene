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

  return (
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
              className="h-28 w-28 shrink-0 rounded-2xl object-cover shadow-md"
            />
          ) : (
            <div
              key={sub.id}
              className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-800 shadow-md"
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
  );
}
