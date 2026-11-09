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
  ArrowRightIcon,
  Buildings3Icon,
  EnvelopeClosedIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
} from '@navikt/aksel-icons';
import { EinButton } from '~/components/EinButton/EinButton';
import styles from './AboutNaturalPage.module.scss';

export default function AboutNaturalPage() {
  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <div className={styles.page}>
          <section className={styles.hero}>
            <span className={styles.eyebrow}>Tenesta</span>
            <Heading level={1} data-size="xl" className={styles.title}>
              Om eInnsyn
            </Heading>
            <Paragraph className={styles.lead}>
              I eInnsyn kan du søke i dokument frå offentlege verksemder og be
              om å få sjå dei. Tenesta er gratis og open for alle.
            </Paragraph>
            <div className={styles.actions}>
              <EinButton asChild>
                <a href="mailto:kontakt@einnsyn.no" className={styles.cta}>
                  Kontakt oss
                  <ArrowRightIcon aria-hidden="true" />
                </a>
              </EinButton>
              <Link
                href="https://samarbeid.digdir.no"
                className={styles.plainLink}
              >
                Registrer di verksemd i eInnsyn
              </Link>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.cards}>
              <Card data-color="neutral" className={styles.card}>
                <div className={styles.tile}>
                  <span className={styles.tileIcon}>
                    <MagnifyingGlassIcon aria-hidden="true" focusable="false" />
                  </span>
                </div>
                <Heading level={2} data-size="2xs">
                  Finn offentlege dokument
                </Heading>
                <Paragraph data-size="sm" className={styles.muted}>
                  Her finn du postjournalane til statlege verksemder, kommunar
                  og fylkeskommunar. Du finn òg informasjon om møte i politiske
                  utval.
                </Paragraph>
              </Card>
              <Card data-color="neutral" className={styles.card}>
                <div className={styles.tile}>
                  <span className={styles.tileIcon}>
                    <FileTextIcon aria-hidden="true" focusable="false" />
                  </span>
                </div>
                <Heading level={2} data-size="2xs">
                  Be om innsyn
                </Heading>
                <Paragraph data-size="sm" className={styles.muted}>
                  Finn du eit dokument du vil lese, kan du be om å få sjå det.
                  Det kallar vi å be om innsyn. Verksemda som eig dokumentet,
                  avgjer om du får innsyn.
                </Paragraph>
              </Card>
              <Card data-color="neutral" className={styles.card}>
                <div className={styles.tile}>
                  <span className={styles.tileIcon}>
                    <Buildings3Icon aria-hidden="true" focusable="false" />
                  </span>
                </div>
                <Heading level={2} data-size="2xs">
                  Felles for heile forvaltninga
                </Heading>
                <Paragraph data-size="sm" className={styles.muted}>
                  Du kan søke i dokument frå staten og frå kommunar og
                  fylkeskommunar som brukar eInnsyn – alt på éin stad.
                </Paragraph>
              </Card>
            </div>
          </section>

          <section className={styles.section}>
            <span className={styles.eyebrow}>Tilbakemelding</span>
            <Heading level={2} data-size="lg" className={styles.title}>
              Gje oss ei tilbakemelding!
            </Heading>
            <div className={styles.stage}>
              <Card data-color="neutral" className={styles.floating}>
                <Paragraph>
                  Den nye versjonen av eInnsyn er framleis under utvikling.
                  Nokre funksjonar manglar, og noko fungerer kanskje ikkje som
                  det skal. Vi rettar feil og legg til nye funksjonar
                  fortløpande.
                </Paragraph>
                <Paragraph>
                  Vi vil gjerne vite kva du synest. Send e-post til{' '}
                  <Link href="mailto:kontakt@einnsyn.no">
                    kontakt@einnsyn.no
                  </Link>{' '}
                  og fortel kva som fungerer, kva som manglar eller kva som kan
                  bli betre. Har du funne ein feil, skriv gjerne kva du prøvde å
                  gjere og kva som skjedde.
                </Paragraph>
              </Card>
            </div>
          </section>

          <section className={styles.section}>
            <span className={styles.eyebrow}>Verksemder</span>
            <Heading level={2} data-size="lg" className={styles.title}>
              Registrer di verksemd i eInnsyn
            </Heading>
            <Paragraph className={styles.lead}>
              Vil verksemda di publisere dokument i eInnsyn?{' '}
              <Link href="https://samarbeid.digdir.no">
                Sjå kva de må gjere for å kome i gang
              </Link>
              .
            </Paragraph>
            <Card data-color="neutral" className={styles.list}>
              <Details className={styles.row}>
                <DetailsSummary className={styles.rowSummary}>
                  Kommunar og fylkeskommunar
                </DetailsSummary>
                <DetailsContent className={styles.rowContent}>
                  eInnsyn er lagt til rette for at kommunar og fylkeskommunar
                  kan ta løysinga i bruk. Om din kommune eller fylkeskommune er
                  interessert, ta kontakt med oss på{' '}
                  <Link href="mailto:servicedesk@digdir.no">
                    servicedesk@digdir.no
                  </Link>
                  .
                </DetailsContent>
              </Details>
              <Details className={styles.row}>
                <DetailsSummary className={styles.rowSummary}>
                  Statlege verksemder
                </DetailsSummary>
                <DetailsContent className={styles.rowContent}>
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
            <span className={styles.eyebrow}>Kontakt</span>
            <Heading level={2} data-size="lg" className={styles.title}>
              Kontakt oss
            </Heading>
            <Card data-color="neutral" className={styles.contact}>
              <div className={styles.contactText}>
                <Heading level={3} data-size="2xs">
                  Brukarstøtte
                </Heading>
                <Paragraph data-size="sm" className={styles.muted}>
                  Har du spørsmål om eInnsyn, eller får du ikkje til noko? Ta
                  kontakt med oss.
                </Paragraph>
                <Paragraph data-size="sm" className={styles.muted}>
                  Spørsmål om eit innsynskrav du har sendt, må du rette til
                  verksemda som har dokumentet.
                </Paragraph>
              </div>
              <div className={styles.contactLinks}>
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
