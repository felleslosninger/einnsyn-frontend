import {
  Card,
  Details,
  DetailsContent,
  DetailsSummary,
  Divider,
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
import styles from './AboutRunlayerPage.module.scss';

export default function AboutRunlayerPage() {
  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <div className={styles.frame}>
          <section className={styles.hero}>
            <Heading level={1} data-size="2xl" className={styles.pageTitle}>
              Om eInnsyn
            </Heading>
            <Paragraph className={styles.muted}>
              I eInnsyn kan du søke i dokument frå offentlege verksemder og be
              om å få sjå dei. Tenesta er gratis og open for alle.
            </Paragraph>
          </section>

          <Divider className={styles.rule} />

          <section className={styles.features}>
            <Card data-color="neutral" className={styles.feature}>
              <span className={styles.iconTile}>
                <MagnifyingGlassIcon aria-hidden="true" focusable="false" />
              </span>
              <Heading level={2} data-size="sm">
                Finn offentlege dokument
              </Heading>
              <Paragraph data-size="sm" className={styles.muted}>
                Her finn du postjournalane til statlege verksemder, kommunar og
                fylkeskommunar. Du finn òg informasjon om møte i politiske
                utval.
              </Paragraph>
            </Card>
            <Card data-color="neutral" className={styles.feature}>
              <span className={styles.iconTile}>
                <FileTextIcon aria-hidden="true" focusable="false" />
              </span>
              <Heading level={2} data-size="sm">
                Be om innsyn
              </Heading>
              <Paragraph data-size="sm" className={styles.muted}>
                Finn du eit dokument du vil lese, kan du be om å få sjå det. Det
                kallar vi å be om innsyn. Verksemda som eig dokumentet, avgjer
                om du får innsyn.
              </Paragraph>
            </Card>
            <Card data-color="neutral" className={styles.feature}>
              <span className={styles.iconTile}>
                <Buildings3Icon aria-hidden="true" focusable="false" />
              </span>
              <Heading level={2} data-size="sm">
                Felles for heile forvaltninga
              </Heading>
              <Paragraph data-size="sm" className={styles.muted}>
                Du kan søke i dokument frå staten og frå kommunar og
                fylkeskommunar som brukar eInnsyn – alt på éin stad.
              </Paragraph>
            </Card>
          </section>

          <Divider className={styles.rule} />

          <section className={styles.split}>
            <div className={styles.splitHeading}>
              <span className={styles.iconTile}>
                <Chat2Icon aria-hidden="true" focusable="false" />
              </span>
              <Heading level={2} data-size="lg" className={styles.sectionTitle}>
                Gje oss ei tilbakemelding!
              </Heading>
            </div>
            <Card data-color="accent" variant="tinted" className={styles.panel}>
              <Paragraph>
                Den nye versjonen av eInnsyn er framleis under utvikling. Nokre
                funksjonar manglar, og noko fungerer kanskje ikkje som det skal.
                Vi rettar feil og legg til nye funksjonar fortløpande.
              </Paragraph>
              <Paragraph>
                Vi vil gjerne vite kva du synest. Send e-post til{' '}
                <Link href="mailto:kontakt@einnsyn.no">kontakt@einnsyn.no</Link>{' '}
                og fortel kva som fungerer, kva som manglar eller kva som kan
                bli betre. Har du funne ein feil, skriv gjerne kva du prøvde å
                gjere og kva som skjedde.
              </Paragraph>
            </Card>
          </section>

          <Divider className={styles.rule} />

          <section className={styles.split}>
            <div className={styles.splitHeading}>
              <Heading level={2} data-size="lg" className={styles.sectionTitle}>
                Registrer di verksemd i eInnsyn
              </Heading>
            </div>
            <div className={styles.splitBody}>
              <div className={styles.pane}>
                <Paragraph className={styles.muted}>
                  Vil verksemda di publisere dokument i eInnsyn?{' '}
                  <Link href="https://samarbeid.digdir.no">
                    Sjå kva de må gjere for å kome i gang
                  </Link>
                  .
                </Paragraph>
              </div>
              <Details data-color="neutral" className={styles.row}>
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
              <Details data-color="neutral" className={styles.row}>
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
            </div>
          </section>

          <Divider className={styles.rule} />

          <section className={styles.split}>
            <div className={styles.splitHeading}>
              <Heading level={2} data-size="lg" className={styles.sectionTitle}>
                Kontakt oss
              </Heading>
            </div>
            <div className={styles.splitBody}>
              <div className={styles.pane}>
                <Heading level={3} data-size="sm">
                  Brukarstøtte
                </Heading>
                <Paragraph className={styles.muted}>
                  Har du spørsmål om eInnsyn, eller får du ikkje til noko? Ta
                  kontakt med oss.
                </Paragraph>
                <Paragraph className={styles.muted}>
                  Spørsmål om eit innsynskrav du har sendt, må du rette til
                  verksemda som har dokumentet.
                </Paragraph>
              </div>
              <span className={styles.contactRow}>
                <EnvelopeClosedIcon title="E-post" fontSize="1.5rem" />
                <Link href="mailto:kontakt@einnsyn.no">kontakt@einnsyn.no</Link>
              </span>
              <span className={styles.contactRow}>
                <PhoneIcon title="Telefon" fontSize="1.5rem" />
                <Link href="tel:+4780030613">800 30 613</Link>
              </span>
            </div>
          </section>
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
