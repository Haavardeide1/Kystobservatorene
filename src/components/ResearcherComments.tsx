"use client";

import { useEffect, useState } from "react";

type ResearcherComment = {
  id: string;
  display_name: string | null;
  media_type: "photo" | "video";
  media_url: string | null;
  researcher_comment: string;
  researcher_name: string;
  researcher_commented_at: string;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ResearcherComments() {
  const [items, setItems] = useState<ResearcherComment[]>([]);

  useEffect(() => {
    fetch("/api/submissions/list")
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data) return;
        const withComments = data.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (s: any) => s.researcher_comment && s.researcher_name
        ) as ResearcherComment[];
        setItems(withComments.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="bg-[#070b2f] text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
            Fra NORCE
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight md:text-3xl">
            Forskerkommentarer
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Observasjoner som NORCE-forskere har fremhevet og kommentert.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              {/* Media */}
              {item.media_url && (
                <div className="relative h-44 overflow-hidden">
                  {item.media_type === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.media_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.media_url}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-xs font-semibold text-white/80">
                    {item.display_name || "Anonym"} · {formatDate(item.created_at)}
                  </div>
                </div>
              )}

              {/* Kommentar */}
              <div className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/20 text-sm">
                    🔬
                  </div>
                  <div>
                    <p className="text-xs font-bold text-cyan-400">{item.researcher_name}</p>
                    <p className="text-[10px] text-white/40">
                      {formatDate(item.researcher_commented_at)}
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/80">
                  &quot;{item.researcher_comment}&quot;
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
