import Image from "next/image";
import SiteHeader from "@/components/site/SiteHeader";

export default function OmPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader variant="dark" />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#070b2f] text-white">
        <div className="mx-auto w-full max-w-6xl px-6 pb-10 pt-10 md:pb-20 md:pt-20">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
            Kystobservatørene
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-7xl">
            <span className="text-white/40">Om</span>{" "}
            <span className="text-white">prosjektet</span>
          </h1>

          <div className="mt-8 grid max-w-5xl gap-8 md:mt-10 md:grid-cols-2 md:gap-10">
            <div className="space-y-6 text-base leading-relaxed text-white/75">
              <p>
                <span className="font-semibold text-[#60a5fa]">Omtrent 80 prosent</span>{" "}
                av Norges befolkning bor i nærheten av kysten. Havstrømmene påvirker alt fra vær og bølger til hva som driver hvor. Mer presise modeller gir tryggere ferdsel, bedre beslutninger og økt forståelse av kystmiljøet.
              </p>
              <p>
                Ved at du sender inn bilder eller video av havoverflaten, kan du bidra direkte inn til havforskningen. Dataen vi får fra bilder og video gjør at forskerne kan validere og forbedre NORCE sine prediksjonsmodeller, som varsler bølger og strøm langs kysten. Slik kan man få enda mer presise varslinger.
              </p>
              <p>
                Jo flere observasjoner, desto mer styrkes datagrunnlaget for forskning og varsling – og kunnskapen vår om havet.
              </p>
              <div className="border-t border-white/10 pt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                  Bakgrunn
                </p>
                <p>
                  Kystobservatørene er del av forsknings- og formidlingsprosjektet «Kunnskapsstrømmer i havet», initiert av NORCE Research og Fremje. Prosjektet har mottatt støtte fra Norges Forskningsråd, med mål om å gjøre havforskning mer tilgjengelig og forståelig for folk flest.
                </p>
              </div>
            </div>

            {/* NORCE card */}
            <div className="flex flex-col justify-center gap-6 md:pl-8">
              <a
                href="https://www.norceresearch.no"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition hover:bg-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/norce-logo.png"
                  alt="NORCE"
                  className="mb-6 h-7 object-contain opacity-90"
                />
                <p className="text-sm font-semibold leading-relaxed text-white/90">
                  NORCE er et forskningsinstitutt med ett mål for øye:
                  bærekraftige innovasjoner og løsninger for vår felles fremtid.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  NORCE leverer forskning og innovasjon innen energi, helse,
                  klima, miljø, samfunn og teknologi.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  Forskning på kyststrømmer er ikke bare relevant på skrivebordet
                  — den angår alle som lever ved kysten. Enten du fisker,
                  surfer, seiler eller bare liker å bade.
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/30 transition group-hover:text-white/50">
                  norceresearch.no →
                </p>
              </a>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="relative h-10 bg-[#070b2f] md:h-20">
          <svg className="absolute bottom-0 h-10 w-full md:h-20" viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path
              d="M0,64L120,58C240,52,480,42,720,48C960,54,1200,72,1320,78L1440,84L1440,80L0,80Z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </section>

      {/* ── Oppdrag / Visjon / Mål ────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 pb-10 md:pb-20">
          <div className="grid gap-4 sm:grid-cols-3 md:gap-6">
            {[
              {
                title: "Oppdrag",
                body: "Gjøre havet mer forståelig ved å la folk bidra direkte til forskningen.",
              },
              {
                title: "Visjon",
                body: "Et kyst-Norge der alle forstår havet bedre, og der bedre kunnskap gir tryggere ferdsel.",
              },
              {
                title: "Mål",
                body: "Samle observasjoner som gjør at varslinger blir bedre for alle som lever og arbeider langs kysten.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl bg-[#070b2f] px-6 py-8 text-white shadow"
              >
                <h4 className="text-lg font-semibold uppercase tracking-[0.15em]">
                  {card.title}
                </h4>
                <p className="mt-4 text-sm leading-relaxed text-white/80">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-[#070b2f] text-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-10">
              <a href="https://www.norceresearch.no/" target="_blank" rel="noopener noreferrer" className="opacity-80 transition hover:opacity-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/norce-logo.png" alt="NORCE" className="h-8 object-contain" />
              </a>
              <a href="https://www.fremje.com/" target="_blank" rel="noopener noreferrer" className="opacity-80 transition hover:opacity-100">
                <Image src="/fremje-logo.png" alt="Fremje" width={160} height={64} className="h-16 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
              </a>
            </div>
            <div className="text-xs text-white/60">© 2026 Kystobservatørene</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
