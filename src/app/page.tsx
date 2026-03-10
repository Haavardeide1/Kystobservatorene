import dynamic from "next/dynamic";
import SiteHeader from "@/components/site/SiteHeader";
import TopFive from "@/components/TopFive";
import WeeklyCarousel from "@/components/WeeklyCarousel";
import ResearcherComments from "@/components/ResearcherComments";

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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-8 pt-10 md:flex-row md:items-end md:gap-10 md:pb-16 md:pt-20">
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
              Delta i
            </p>
            <h1 className="mt-3 text-[1.75rem] font-black uppercase tracking-tight sm:text-4xl md:mt-4 md:text-6xl">
              Kystobservatørene
            </h1>
            <p className="mt-3 max-w-xl text-base text-white/70 md:mt-4 md:text-lg">
              Borgervitenskap for kysten. Vi samler observasjoner av havoverflaten
              for å forstå strømmer, varsle bedre og skape tryggere kystliv.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 md:mt-8">
              <a
                href="/observasjoner"
                className="rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-white/90"
              >
                Bidra med observasjon
              </a>
              <a
                href="/kart"
                className="rounded-full border border-white/30 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Se kartet
              </a>
            </div>
          </div>

          {/* Hero visual card — video background */}
          <div className="relative flex-1">
            <div className="absolute -right-10 -top-8 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="relative h-48 overflow-hidden rounded-3xl border border-white/10 shadow-2xl md:h-72">
              {/* Background video */}
              <video
                src="https://uerpagaucgqoytcgwgdg.supabase.co/storage/v1/object/public/assets/hero-ocean.mp4.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-[#070b2f]/50" />
              {/* NORCE logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/norce-logo.png"
                alt="NORCE"
                className="absolute inset-0 m-auto h-auto w-32 object-contain opacity-80 drop-shadow-lg md:w-44"
              />
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="relative h-12 bg-[#070b2f] md:h-24">
          <svg className="absolute bottom-0 h-12 w-full md:h-24" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path
              d="M0,96L120,90.7C240,85,480,75,720,80C960,85,1200,107,1320,117.3L1440,128L1440,120L1320,120C1200,120,960,120,720,120C480,120,240,120,120,120L0,120Z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </section>

      {/* ── Bidra ─────────────────────────────────────────────────────────── */}
      <section id="bidra" className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black uppercase tracking-tight text-[#070b2f] md:text-4xl">
              Bidra med observasjoner
            </h2>
            <p className="mt-4 text-base text-slate-600 md:text-lg">
              Ta et bilde eller en kort video av havflaten og bidra til ny kunnskap
              om havstrømmer langs kysten.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-[1.1fr_1.3fr] md:gap-6">
            {/* Real coastal photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bildemobil.jpg"
              alt="Foto fra kysten"
              className="h-48 w-full rounded-3xl object-cover shadow-lg md:h-64"
            />

            <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-3xl shadow-lg md:h-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/undervann.jpg"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(15,23,42,0.75),rgba(11,42,74,0.7),rgba(7,22,44,0.75))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.15),_transparent_60%)]" />
              <a
                href="/observasjoner"
                className="relative rounded-full border-2 border-white bg-white/95 px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#0b2a4a] shadow-xl transition hover:bg-white md:px-10 md:py-4"
              >
                Send inn her
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Slik gjør du det ──────────────────────────────────────────────── */}
      <section className="border-t border-slate-100 bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Slik gjør du det
          </p>
          <div className="mt-6 grid gap-8 sm:grid-cols-3 md:mt-8 md:gap-10">
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
                body: "Observasjonen havner rett i databasen og vises på kartet for alle.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 md:gap-5">
                <span className="mt-0.5 select-none text-4xl font-black leading-none text-slate-100 md:text-5xl">
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
        <div className="mx-auto w-full max-w-6xl px-6 py-10 text-center md:py-12">
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
            href="/om"
            className="mt-6 inline-block text-sm font-semibold uppercase tracking-[0.2em] text-white/50 transition hover:text-white/80"
          >
            Les mer →
          </a>
        </div>
      </section>

      {/* Divider */}
      <div className="bg-[#070b2f]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="border-t border-white/10" />
        </div>
      </div>

      {/* ── Kart (mini-map) ───────────────────────────────────────────────── */}
      <section id="kart" className="bg-[#070b2f]">
        <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-8 md:pb-16">
          <HomeMiniMap />
        </div>
      </section>

      {/* ── Ukens topp 5 ─────────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8bb0d9]">
                Denne uken
              </p>
              <h3 className="mt-1 text-2xl font-black uppercase tracking-tight text-[#070b2f] md:text-3xl">
                Ukens observasjoner
              </h3>
            </div>
            <a
              href="/kart"
              className="rounded-full border border-[#070b2f]/20 bg-white px-5 py-2.5 text-xs font-semibold text-[#070b2f] shadow-sm transition hover:bg-[#070b2f] hover:text-white"
            >
              Se alle på kartet →
            </a>
          </div>
          <div className="mt-6 md:mt-8">
            <TopFive />
          </div>
          <WeeklyCarousel />
        </div>
      </section>

      <ResearcherComments />

      {/* ── Om (full) ─────────────────────────────────────────────────────── */}
      <section id="om" className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-16">
          <div className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr] md:gap-10">
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tight text-[#8bb0d9] md:text-4xl">
                Omtrent 80 %
              </h3>
              <p className="mt-4 text-base text-slate-600 md:text-lg">
                av oss bor i nærheten av kysten. Havstrømmene påvirker alt fra vær
                og bølger til hva som driver hvor. Mer kunnskap om strøm gir en
                bedre forståelse av kysten og tryggere beslutninger.
              </p>
              <a
                href="/om"
                className="mt-6 inline-block text-sm font-semibold text-[#1d5fa7] transition hover:underline"
              >
                Les mer om prosjektet →
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bildebat.jpg"
                alt="Fiskebåt ved kysten"
                className="h-44 w-full rounded-2xl object-cover shadow-md md:h-52"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/oppdrett.jpg"
                alt="Oppdrettsanlegg"
                className="h-44 w-full rounded-2xl object-cover shadow-md md:h-52"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Samarbeidspartner ─────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Samarbeidspartner
          </p>
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-stretch md:gap-6">
            <a
              href="https://www.barentswatch.no/bolgevarsel/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-1 items-center gap-4 rounded-3xl border border-slate-200 bg-[#f0f6ff] px-5 py-6 transition hover:border-blue-300 hover:bg-[#e6f0ff] hover:shadow-lg md:gap-6 md:px-8 md:py-8"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0a3a6e] text-2xl shadow-md md:h-14 md:w-14 md:text-3xl">
                🌊
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  BarentsWatch
                </p>
                <h4 className="mt-1 text-base font-bold text-[#070b2f] md:text-lg">
                  Bølgevarsel
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Live bølgevarsler for norske farvann — isolinjer, kryssende sjø og punktvarsler langs kysten.
                </p>
              </div>
              <span className="shrink-0 text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-400">
                →
              </span>
            </a>

            <div className="flex flex-1 flex-col justify-center rounded-3xl border border-dashed border-slate-200 px-5 py-6 text-center md:px-8 md:py-8">
              <p className="text-sm text-slate-400">
                Interessert i annen forskning fra NORCE?
              </p>
              <a
                href="https://www.norceresearch.no/forskergruppe/hav-og-kyst"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-[#1d5fa7] transition hover:underline"
              >
                Les mer →
              </a>
            </div>
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/fremje-logo.png" alt="Fremje" className="h-16 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
              </a>
            </div>
            <div className="text-xs text-white/60">© 2026 Kystobservatørene</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
