import dynamic from "next/dynamic";
import SiteHeader from "@/components/site/SiteHeader";

const HomeMiniMap = dynamic(() => import("@/components/HomeMiniMap"), {
  ssr: false,
  loading: () => (
    <div className="mt-8 h-[480px] animate-pulse rounded-3xl bg-slate-100" />
  ),
});

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader variant="dark" />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#070b2f] text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-20 md:flex-row md:items-end">
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
              Kystobservatørene
            </p>
            <h1 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-6xl">
              Kystobservatørene
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/70 md:text-lg">
              Borgervitenskap for kysten. Vi samler observasjoner av havoverflaten
              for å forstå strømmer, varsle bedre og skape tryggere kystliv.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#bidra"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
              >
                Bidra med observasjon
              </a>
              <a
                href="/kart"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Se kartet
              </a>
            </div>
          </div>

          {/* Hero visual card — video background */}
          <div className="relative flex-1">
            <div className="absolute -right-10 -top-8 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="relative h-56 overflow-hidden rounded-3xl border border-white/10 shadow-2xl md:h-72">
              {/* Background video */}
              <video
                src="https://uerpagaucgqoytcgwgdg.supabase.co/storage/v1/object/public/assets/hero-ocean.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Dark overlay so text stays readable */}
              <div className="absolute inset-0 bg-[#070b2f]/50" />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a1a3a] to-transparent" />
              {/* Live indicator */}
              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/80">Live data</span>
              </div>
              {/* Coordinate readout */}
              <div className="absolute right-5 top-5 font-mono text-xs text-white/40">
                63.4°N · 10.4°E
              </div>
              <p className="absolute bottom-6 left-6 text-xs uppercase tracking-[0.35em] text-white/60">
                Havet i bevegelse
              </p>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="relative h-24 bg-[#070b2f]">
          <svg className="absolute bottom-0 h-24 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path
              d="M0,96L120,90.7C240,85,480,75,720,80C960,85,1200,107,1320,117.3L1440,128L1440,120L1320,120C1200,120,960,120,720,120C480,120,240,120,120,120L0,120Z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </section>

      {/* ── Bidra ─────────────────────────────────────────────────────────── */}
      <section id="bidra" className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black uppercase tracking-tight text-[#070b2f] md:text-4xl">
              Bidra med observasjoner
            </h2>
            <p className="mt-4 text-base text-slate-600 md:text-lg">
              Ta et bilde eller en kort video av havflaten og bidra til ny kunnskap
              om havstrømmer langs kysten.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-[1.1fr_1.3fr]">
            {/* Real coastal photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bildemobil.jpg"
              alt="Foto fra kysten"
              className="h-56 w-full rounded-3xl object-cover shadow-lg md:h-64"
            />

            <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-3xl bg-[linear-gradient(130deg,#0f172a,#0b2a4a,#07162c)] shadow-lg md:h-64">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.3),_transparent_60%)]" />
              <a
                href="/observasjoner"
                className="relative rounded-full border-2 border-white bg-white/95 px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#0b2a4a] shadow-xl transition hover:bg-white"
              >
                Send inn her
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Slik gjør du det ──────────────────────────────────────────────── */}
      <section className="border-t border-slate-100 bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Slik gjør du det
          </p>
          <div className="mt-8 grid gap-10 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Ta et bilde eller video",
                body: "Noen sekunder av havoverflaten er nok. Bruk telefonen der du er — ved kaien, på båten, eller fra stranden.",
              },
              {
                step: "02",
                title: "Merk posisjonen",
                body: "GPS finner deg automatisk, eller du klikker på kartet. Det tar fem sekunder og gir observasjonen verdi.",
              },
              {
                step: "03",
                title: "Send inn",
                body: "Trykk send. Observasjonen havner rett i databasen og vises på kartet for alle.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-5">
                <span className="mt-0.5 select-none text-5xl font-black leading-none text-slate-100">
                  {item.step}
                </span>
                <div>
                  <h4 className="font-semibold text-slate-900">{item.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Om prosjektet banner ───────────────────────────────────────────── */}
      <section className="bg-[#070b2f] text-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">
            Om prosjektet
          </p>
          <p className="mt-4 text-base text-white/90 md:text-lg">
            Kystobservatørene er et forskningsprosjekt for å engasjere folk langs kysten
            i forskning på havstrømmer. Vi inviterer publikum til å bidra med bilder
            eller korte videoer av havflaten som kan brukes til verifisering og
            forbedring av varslingsmodeller.
          </p>
          <a
            href="/#om"
            className="mt-6 inline-block text-sm font-semibold uppercase tracking-[0.2em] text-white/50 transition hover:text-white/80"
          >
            Les mer ↓
          </a>
        </div>
      </section>

      {/* ── Kart (mini-map) ───────────────────────────────────────────────── */}
      <section id="kart" className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <HomeMiniMap />
        </div>
      </section>

      {/* ── Ukens topp 5 ─────────────────────────────────────────────────── */}
      <section className="bg-[#eaf2fb]">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <h3 className="text-3xl font-black uppercase tracking-tight text-[#8bb0d9]">
            Ukens topp 5
          </h3>
          <div className="mt-10 rounded-3xl bg-white px-6 py-12 text-center shadow-lg">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#070b2f]" />
            <p className="text-base font-semibold">Ingen bidrag denne uken ennå</p>
            <p className="mt-2 text-sm text-slate-500">
              Vær den første til å sende inn en observasjon!
            </p>
            <div className="mt-8 border-t border-slate-100 pt-4 text-xs uppercase tracking-[0.2em] text-slate-400">
              Uke 9 · 23. feb. – 1. mars
            </div>
          </div>
        </div>
      </section>

      {/* ── Om (full) ─────────────────────────────────────────────────────── */}
      <section id="om" className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-[1.1fr_1fr]">
            <div>
              <h3 className="text-4xl font-black uppercase tracking-tight text-[#8bb0d9]">
                Omtrent 80 %
              </h3>
              <p className="mt-4 text-base text-slate-600 md:text-lg">
                av oss bor i nærheten av kysten. Havstrømmene påvirker alt fra vær
                og bølger til hva som driver hvor. Mer kunnskap om strøm gir en
                bedre forståelse av kysten og tryggere beslutninger.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="h-32 rounded-2xl bg-[linear-gradient(135deg,#bfd7ef,#e5effa)]" />
              <div className="h-32 rounded-2xl bg-[linear-gradient(135deg,#6b8fb6,#2b4f74)]" />
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
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
                <p className="mt-4 text-sm text-white/80">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-[#070b2f] text-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-10">
              <img
                src="/norce-logo.png"
                alt="NORCE"
                className="h-8 object-contain opacity-80"
              />
              <img
                src="/fremje-logo.png"
                alt="Fremje"
                className="h-10 object-contain opacity-80"
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
