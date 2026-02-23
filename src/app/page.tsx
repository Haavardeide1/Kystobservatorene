import dynamic from "next/dynamic";
import SiteHeader from "@/components/site/SiteHeader";

const HomeMiniMap = dynamic(() => import("@/components/HomeMiniMap"), {
  ssr: false,
  loading: () => (
    <div className="mt-8 h-80 animate-pulse rounded-3xl bg-slate-100" />
  ),
});

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader variant="dark" />

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
          <div className="relative flex-1">
            <div className="absolute -right-10 -top-8 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="relative h-56 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 shadow-2xl md:h-72">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_60%)]" />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a1a3a] to-transparent" />
              <p className="absolute bottom-6 left-6 text-xs uppercase tracking-[0.35em] text-white/60">
                Havet i bevegelse
              </p>
            </div>
          </div>
        </div>
        <div className="relative h-24 bg-[#070b2f]">
          <svg
            className="absolute bottom-0 h-24 w-full"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,96L120,90.7C240,85,480,75,720,80C960,85,1200,107,1320,117.3L1440,128L1440,120L1320,120C1200,120,960,120,720,120C480,120,240,120,120,120L0,120Z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </section>

      <section id="bidra" className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black uppercase tracking-tight text-[#1d5fa7] md:text-4xl">
              Bidra med observasjoner
            </h2>
            <p className="mt-4 text-base text-slate-600 md:text-lg">
              Ta et bilde eller en kort video av havflaten og bidra til ny kunnskap
              om havstrømmer langs kysten.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-[1.1fr_1.3fr]">
            <div className="relative h-56 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-200 via-slate-100 to-white shadow-lg md:h-64">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(148,163,184,0.5),transparent_55%)]" />
              <p className="absolute bottom-6 left-6 text-xs uppercase tracking-[0.3em] text-slate-500">
                Foto fra kysten
              </p>
            </div>
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

      <section className="bg-[#1d6fb8] text-white">
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
        </div>
      </section>

      <section id="kart" className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <HomeMiniMap />
        </div>
      </section>

      <section className="bg-[#eaf2fb]">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <h3 className="text-3xl font-black uppercase tracking-tight text-[#8bb0d9]">
            Ukens topp 5
          </h3>
          <div className="mt-10 rounded-3xl bg-white px-6 py-12 text-center shadow-lg">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#1d5fa7]" />
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
                body:
                  "Gjøre havet mer forståelig ved å koble observasjoner med prediksjonsmodeller. Bidragene styrker datagrunnlaget for forskning og varsling.",
              },
              {
                title: "Visjon",
                body:
                  "Et kyst-Norge som forstår havet bedre. Når mange bidrar med små observasjoner, øker kunnskapen og strømmer blir litt mindre farlige.",
              },
              {
                title: "Mål",
                body:
                  "Forbedre prediksjonsmodeller og gi et mer robust grunnlag for bedre beslutninger og tryggere aktivitet langs kysten.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl bg-[#6b9cc8] px-6 py-8 text-white shadow"
              >
                <h4 className="text-lg font-semibold uppercase tracking-[0.15em]">
                  {card.title}
                </h4>
                <p className="mt-4 text-sm text-white/90">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#070b2f] text-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-10 text-sm uppercase tracking-[0.2em] text-white/70">
              <span>Insert NORCE Logo</span>
              <span>Insert Fremje Logo</span>
            </div>
            <div className="text-xs text-white/60">© 2026 Kystobservatørene</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

