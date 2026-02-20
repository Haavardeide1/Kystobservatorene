export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-10 px-6 py-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
            Kystobservatorene
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Ny plattform under bygging
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/70 md:text-lg">
            Vi setter opp en ny infrastruktur for innsendelser, kart og NORCE-portalen.
            Autentisering er aktivert, og videre funksjoner kommer trinnvis.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <a
            href="/login"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
          >
            Logg inn / Opprett konto
          </a>
          <span className="rounded-full border border-white/20 px-6 py-3 text-sm text-white/70">
            Backend: Supabase (EU)
          </span>
        </div>
      </main>
    </div>
  );
}
