import SiteHeader from "@/components/site/SiteHeader";

export default function OmPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader variant="dark" />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#070b2f] text-white">
        <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-20">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
            Kystobservatørene
          </p>
          <h1 className="mt-4 text-5xl font-black uppercase tracking-tight md:text-7xl">
            <span className="text-white/40">Om</span>{" "}
            <span className="text-white">prosjektet</span>
          </h1>

          <div className="mt-10 grid max-w-5xl gap-10 md:grid-cols-2">
            <div className="space-y-6 text-base leading-relaxed text-white/75">
              <p>
                Ved å ta bilder eller korte videoer av havflaten kan publikum
                sende inn observasjoner som brukes til å verifisere og forbedre
                NORCE sine strømmodeller. Når mange bidrar med små observasjoner,
                styrkes datagrunnlaget for forskning og varsling – og kunnskapen
                om hvordan havet beveger seg blir bedre.
              </p>
              <p>
                <span className="font-semibold text-[#60a5fa]">
                  Omtrent 80 prosent
                </span>{" "}
                av oss bor i nærheten av kysten. Havstrømmene påvirker alt fra
                vær og bølger til hva som driver hvor. Mer presise modeller gir
                tryggere ferdsel, bedre beslutninger og økt forståelse av
                kystmiljøet.
              </p>
              <p>
                Kystobservatørene kobler folks egne erfaringer med forskernes
                modeller for strøm og bølger. Ambisjonen er å gjøre havet mer
                forståelig for flere, og å bidra til tryggere aktivitet og mer
                robuste beslutninger langs hele kysten.
              </p>
            </div>

            {/* NORCE card */}
            <div className="flex flex-col justify-center gap-6">
              <a
                href="https://www.norceresearch.no"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition hover:bg-white/10"
              >
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
              <div className="flex gap-3">
                <a
                  href="/observasjoner"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
                >
                  Bidra nå
                </a>
                <a
                  href="/kart"
                  className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Se kartet
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="relative h-20 bg-[#070b2f]">
          <svg className="absolute bottom-0 h-20 w-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path
              d="M0,64L120,58C240,52,480,42,720,48C960,54,1200,72,1320,78L1440,84L1440,80L0,80Z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </section>

      {/* ── Omtrent 80 % + bilder ─────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tight text-[#8bb0d9] md:text-5xl">
                Omtrent 80 %
              </h2>
              <p className="mt-6 text-base leading-relaxed text-slate-600 md:text-lg">
                av oss bor i nærheten av kysten. Havstrømmene påvirker alt fra
                vær og bølger til hva som driver hvor. Mer kunnskap om strøm
                gir en bedre forståelse av kysten og tryggere beslutninger.
              </p>
            </div>
            <div className="grid gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bildebat.jpg"
                alt="Fiskebåt ved kysten"
                className="h-40 w-full rounded-2xl object-cover shadow-md"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/oppdrett.jpg"
                alt="Oppdrettsanlegg"
                className="h-40 w-full rounded-2xl object-cover shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Oppdrag / Visjon / Mål ────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 pb-20">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Oppdrag",
                body: "Gjøre havet mer forståelig ved å koble observasjoner med prediksjonsmodeller. Bidragene styrker datagrunnlaget for forskning og varsling.",
              },
              {
                title: "Visjon",
                body: "Et kyst-Norge som forstår havet bedre. Når mange bidrar med små observasjoner, øker kunnskapen og strømmer blir litt mindre farlige.",
              },
              {
                title: "Mål",
                body: "Forbedre prediksjonsmodeller og gi et mer robust grunnlag for bedre beslutninger og tryggere aktivitet langs kysten.",
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

      {/* ── Bakgrunn ──────────────────────────────────────────────────────── */}
      <section className="border-t border-slate-100 bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="text-4xl font-black uppercase tracking-tight text-[#070b2f] md:text-5xl">
            Bakgrunn
          </h2>
          <div className="mt-8 grid max-w-3xl gap-5 text-base leading-relaxed text-slate-600">
            <p>
              Kystobservatørene er en del av forsknings- og
              formidlingsprosjektet «Kunnskapsstrømmer i havet», initiert av
              NORCE Research og Fremje. Prosjektet er støttet av Norges
              Forskningsråd gjennom ordningen for kommunikasjon og formidling
              av klima-, miljø- og havforskning, og skal styrke forståelsen av
              hvordan kunnskap om havet utvikles og brukes.
            </p>
          </div>

          {/* Partner logos */}
          <div className="mt-14 flex flex-wrap items-center gap-10">
            <img
              src="/norce-logo.png"
              alt="NORCE"
              className="h-8 object-contain"
              style={{ filter: "brightness(0)" }}
            />
            <img
              src="/fremje-logo.png"
              alt="Fremje"
              className="h-14 object-contain"
              style={{ filter: "brightness(0)" }}
            />
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-[#070b2f] text-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-10">
              <img src="/norce-logo.png" alt="NORCE" className="h-8 object-contain opacity-80" />
              <img
                src="/fremje-logo.png"
                alt="Fremje"
                className="h-16 object-contain opacity-80"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
            <div className="text-xs text-white/60">© 2026 Kystobservatørene</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
