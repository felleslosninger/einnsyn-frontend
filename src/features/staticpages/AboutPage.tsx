import {
  Card,
  Details,
  DetailsContent,
  DetailsSummary,
  Heading,
  Link,
  ListItem,
  ListUnordered,
  Paragraph,
} from '@digdir/designsystemet-react';
import {
  Buildings3Icon,
  Chat2Icon,
  EnvelopeClosedIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
} from '@navikt/aksel-icons';
import styles from './AboutPage.module.scss';

export default function AboutPage() {
  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <div className={styles.content}>
          <section className={styles.section}>
            <Heading level={1} data-size="lg">
              Om eInnsyn
            </Heading>
            <Paragraph data-size="lg">
              I eInnsyn kan du søke i dokument frå offentlege verksemder og be
              om å få sjå dei. Tenesta er gratis og open for alle.
            </Paragraph>
          </section>

          <section className={styles.section}>
            <div className={styles.features}>
              <Card data-color="neutral" className={styles.featureCard}>
                <span className={styles.featureIcon}>
                  <MagnifyingGlassIcon aria-hidden="true" focusable="false" />
                </span>
                <Heading level={2} data-size="xs">
                  Finn offentlege dokument
                </Heading>
                <Paragraph data-size="sm">
                  Her finn du postjournalane til statlege verksemder, kommunar
                  og fylkeskommunar. Du finn òg informasjon om møte i politiske
                  utval.
                </Paragraph>
              </Card>
              <Card data-color="neutral" className={styles.featureCard}>
                <span className={styles.featureIcon}>
                  <FileTextIcon aria-hidden="true" focusable="false" />
                </span>
                <Heading level={2} data-size="xs">
                  Be om innsyn
                </Heading>
                <Paragraph data-size="sm">
                  Finn du eit dokument du vil lese, kan du be om å få sjå det.
                  Det kallar vi å be om innsyn. Verksemda som eig dokumentet,
                  avgjer om du får innsyn.
                </Paragraph>
              </Card>
              <Card data-color="neutral" className={styles.featureCard}>
                <span className={styles.featureIcon}>
                  <Buildings3Icon aria-hidden="true" focusable="false" />
                </span>
                <Heading level={2} data-size="xs">
                  Felles for heile forvaltninga
                </Heading>
                <Paragraph data-size="sm">
                  Du kan søke i dokument frå staten og frå kommunar og
                  fylkeskommunar som brukar eInnsyn – alt på éin stad.
                </Paragraph>
              </Card>
            </div>
          </section>

          <Card data-color="accent" variant="tinted">
            <Heading
              level={2}
              data-size="sm"
              className={styles.headingWithIcon}
            >
              <Chat2Icon aria-hidden="true" focusable="false" />
              Gje oss ei tilbakemelding!
            </Heading>
            <Paragraph>
              Den nye versjonen av eInnsyn er framleis under utvikling. Nokre
              funksjonar manglar, og noko fungerer kanskje ikkje som det skal.
              Vi rettar feil og legg til nye funksjonar fortløpande.
            </Paragraph>
            <Paragraph>
              Vi vil gjerne vite kva du synest. Send e-post til{' '}
              <Link href="mailto:kontakt@einnsyn.no">kontakt@einnsyn.no</Link>{' '}
              og fortel kva som fungerer, kva som manglar eller kva som kan bli
              betre. Har du funne ein feil, skriv gjerne kva du prøvde å gjere
              og kva som skjedde.
            </Paragraph>
          </Card>

          <section className={styles.section}>
            <Heading level={2} data-size="sm">
              Registrer di verksemd i eInnsyn
            </Heading>
            <Paragraph>
              Vil verksemda di publisere dokument i eInnsyn?{' '}
              <Link href="https://samarbeid.digdir.no">
                Sjå kva de må gjere for å kome i gang
              </Link>
              .
            </Paragraph>
            <Card data-color="neutral">
              <Details>
                <DetailsSummary>Kommunar og fylkeskommunar</DetailsSummary>
                <DetailsContent>
                  eInnsyn er lagt til rette for at kommunar og fylkeskommunar
                  kan ta løysinga i bruk. Om din kommune eller fylkeskommune er
                  interessert, ta kontakt med oss på{' '}
                  <Link href="mailto:servicedesk@digdir.no">
                    servicedesk@digdir.no
                  </Link>
                  .
                </DetailsContent>
              </Details>
              <Details>
                <DetailsSummary>Statlege verksemder</DetailsSummary>
                <DetailsContent className={styles.detailsContent}>
                  <Paragraph>
                    Statlege verksemder har plikt til å bruke eInnsyn. Dette
                    står i offentleglovforskrifta § 6. Plikta gjeld som
                    hovudregel for
                  </Paragraph>
                  <ListUnordered>
                    <ListItem>Statsministerens kontor</ListItem>
                    <ListItem>departementa</ListItem>
                    <ListItem>statsforvaltarane</ListItem>
                    <ListItem>
                      direktorat og tilsyn som dekkjer heile landet
                    </ListItem>
                  </ListUnordered>
                  <Paragraph>
                    Er de usikre på om plikta gjeld dykk, er det departementet
                    over verksemda som avgjer det.
                  </Paragraph>
                </DetailsContent>
              </Details>
            </Card>
          </section>

          <section className={styles.section}>
            <Heading level={2} data-size="sm">
              Kontakt oss
            </Heading>
            <Card data-color="neutral" variant="tinted">
              <Heading level={3} data-size="xs">
                Brukarstøtte
              </Heading>
              <Paragraph>
                Har du spørsmål om eInnsyn, eller får du ikkje til noko? Ta
                kontakt med oss.
              </Paragraph>
              <Paragraph>
                Spørsmål om eit innsynskrav du har sendt, må du rette til
                verksemda som har dokumentet.
              </Paragraph>
              <div className={styles.contactList}>
                <span className={styles.contactRow}>
                  <EnvelopeClosedIcon title="E-post" fontSize="1.5rem" />
                  <Link href="mailto:kontakt@einnsyn.no">
                    kontakt@einnsyn.no
                  </Link>
                </span>
                <span className={styles.contactRow}>
                  <PhoneIcon title="Telefon" fontSize="1.5rem" />
                  <Link href="tel:+4780030613">800 30 613</Link>
                </span>
              </div>
            </Card>
          </section>
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
