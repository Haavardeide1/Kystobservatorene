import SiteHeader from "@/components/site/SiteHeader";

export const metadata = {
  title: "Personvernerklæring – Kystobservatørene",
};

export default function PersonvernPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader variant="light" />

      <main className="mx-auto w-full max-w-2xl px-6 py-12 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Kystobservatørene
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-[#070b2f] md:text-4xl">
          Personvernerklæring
        </h1>
        <p className="mt-2 text-sm text-slate-400">Sist oppdatert: 12.01.2026</p>

        <p className="mt-6 text-base leading-relaxed text-slate-600">
          Denne personvernerklæringen forklarer hvordan Kystobservatørene behandler
          personopplysninger når du deltar i prosjektet ved å sende inn observasjoner
          av havflaten.
        </p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-slate-600">

          <section>
            <h2 className="text-base font-bold text-slate-900">1. Behandlingsansvarlig</h2>
            <p className="mt-3">
              Behandlingsansvarlig for prosjektet er <strong>Fremje AS</strong>.
              Har du spørsmål om hvordan vi behandler personopplysninger, kan du kontakte oss via{" "}
              <a href="https://www.fremje.com/" target="_blank" rel="noopener noreferrer" className="text-[#1d5fa7] hover:underline">
                fremje.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">2. Hvilke opplysninger behandler vi?</h2>
            <p className="mt-3 font-medium text-slate-700">Opplysninger du selv sender inn</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Bilder og video</li>
              <li>Metadata: tidspunkt, geografisk posisjon og tekniske filopplysninger</li>
              <li>Antall innsendinger og svar på spørreskjema</li>
            </ul>
            <p className="mt-3">
              Hvis innsendt materiale inneholder gjenkjennelige personer, regnes det som personopplysninger.
            </p>
            <p className="mt-3 font-medium text-slate-700">Tekniske data</p>
            <p className="mt-2">
              Tekniske loggdata som IP-adresse, nettleser og tidspunkt for besøk kan registreres.
              Dette brukes kun til drift, sikkerhet og grunnleggende statistikk.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">3. Formål med behandlingen</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Forskning:</strong> Observasjoner brukes til å forbedre og validere
                strømvarslingsmodeller utviklet av NORCE.
              </li>
              <li>
                <strong>Forvaltning av deltakertjenesten:</strong> Håndtere innsendinger,
                følge opp deltakere og administrere kvalifiseringsprogrammet.
              </li>
              <li>
                <strong>Formidling:</strong> Bilder/video kan brukes i formidlingsarbeid
                kun hvis du eksplisitt samtykker til dette.
              </li>
              <li>
                <strong>Sikkerhet og drift:</strong> Ivareta teknisk drift og sikker
                håndtering av data.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">4. Behandlingsgrunnlag</h2>
            <p className="mt-3">Vi behandler personopplysninger basert på:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Samtykke (GDPR art. 6 (1)(a)) ved innsending av observasjoner.</li>
              <li>Oppgave i allmennhetens interesse / forskning (GDPR art. 6 (1)(e) og art. 89).</li>
            </ul>
            <p className="mt-3">
              Du kan når som helst trekke samtykke tilbake. Det påvirker ikke forskning
              som allerede er anonymisert.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">5. Lagring og sletting</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Kontaktinformasjon lagres så lenge det er nødvendig for administrasjon.</li>
              <li>
                Observasjonsdata (bilder/video) kan lagres over tid når de inngår i
                forskningsmateriale, i tråd med forskningsetiske retningslinjer.
              </li>
            </ul>
            <p className="mt-3">
              Du kan be om sletting av materiale som identifiserer deg. For forskningsdata
              gjelder unntak dersom data allerede er anonymisert eller inngår i pågående forskning.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">6. Hvem deler vi opplysninger med?</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>NORCE og prosjektets forskningspartnere</li>
              <li>Tekniske leverandører knyttet til sikker lagring og drift</li>
            </ul>
            <p className="mt-3">
              Vi deler ikke personopplysninger med tredjeparter for markedsføring.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">7. Dine rettigheter</h2>
            <p className="mt-3">Du har rett til å:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Få innsyn i hvilke opplysninger vi har om deg</li>
              <li>Kreve retting av uriktige opplysninger</li>
              <li>Kreve sletting («retten til å bli glemt»)</li>
              <li>Trekke tilbake samtykke når som helst</li>
              <li>Klage til Datatilsynet dersom du mener behandlingen er ulovlig</li>
            </ul>
          </section>

        </div>

        <div className="mt-12 border-t border-slate-100 pt-8 text-xs text-slate-400">
          Kystobservatørene er et prosjekt i regi av Fremje AS og NORCE.
        </div>
      </main>
    </div>
  );
}
