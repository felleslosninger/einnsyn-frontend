import { isEnhet, type Journalpost } from '@digdir/einnsyn-sdk';
import { Buildings3Icon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import SearchResultSubheader from './common/SearchResultSubheader';
import styles from './searchResultStyles.module.scss';

function getSaksnummer(item: Journalpost): string | null {
  if (typeof item.saksmappe === 'object' && item.saksmappe?.saksnummer) {
    return item.saksmappe.saksnummer;
  }
  if (typeof item.saksmappe === 'string') {
    return item.saksmappe;
  }
  return null;
}

export default function JournalpostResult({
  className,
  item,
}: {
  className?: string;
  item: Journalpost;
}) {
  const translate = useTranslation();
  const languageCode = useLanguageCode();
  const saksnummer = getSaksnummer(item);
  const journaldato = item.journaldato
    ? dateFormat(item.journaldato, languageCode)
    : undefined;

  return (
    <div className={cn(className, styles.searchResult, 'journalpost-result')}>
      <EinLink href="">
        <h2 className="ds-heading" data-size="sm">
          {item.offentligTittel}
        </h2>
      </EinLink>
      <div
        className={cn('ds-paragraph', styles.searchResultBody)}
        data-size="sm"
      >
        <SearchResultSubheader
          variant="journalpost"
          item={item}
          label={translate('journalpost.label')}
        >
          {saksnummer && (
            <span className={styles.searchResultNumber}>
              {translate('common.number')} {saksnummer}
            </span>
          )}

          {item.journalposttype && (
            <span>{translate(`journalpost.type.${item.journalposttype}`)}</span>
          )}
          {journaldato && (
            <span>
              {translate('common.recordedAt')} {journaldato}
            </span>
          )}
        </SearchResultSubheader>
        <JournalpostCorrespondence journalpost={item} />
        {/* TODO: implement open document functionality
        <a href="http://localhost:3000" className={styles.searchResultAction} target="_blank" rel="noopener noreferrer">
          {translate('search.openDocument')}
        </a> */}
        {/* TODO: implement order access functionality
        <EinLink href="http://localhost:3000" className={styles.searchResultAction}>
          {translate('search.orderAccess')}
        </EinLink> */}
      </div>
    </div>
  );
}

function JournalpostCorrespondence({
  journalpost,
}: {
  journalpost: Journalpost;
}) {
  const t = useTranslation();
  const enhet = journalpost.administrativEnhetObjekt;

  if (!isEnhet(enhet)) {
    return null;
  }

  const partyNames = (typePattern: RegExp) =>
    (journalpost.korrespondansepart ?? [])
      .filter((k) => typeof k !== 'string')
      .filter((k) => typePattern.test(k.korrespondanseparttype))
      .map((k) => k.korrespondansepartNavnSensitiv)
      .filter((navn): navn is string => Boolean(navn));

  let directionLabel = '';
  let party: React.ReactNode = null;

  if (journalpost.journalposttype === 'inngaaende_dokument') {
    directionLabel = t('journalpost.from');
    party = <PartyNameList names={partyNames(/^[Aa]vsender$/)} />;
  } else if (journalpost.journalposttype === 'utgaaende_dokument') {
    directionLabel = t('journalpost.to');
    party = <PartyNameList names={partyNames(/^[Mm]ottaker$/)} />;
  } else {
    return (
      <div className={styles.searchResultEnhet}>
        <Buildings3Icon aria-hidden="true" focusable="false" />
        {enhet.navn}
      </div>
    );
  }

  return (
    <div className={styles.searchResultCorrespondence}>
      <Buildings3Icon
        className={styles.correspondenceIcon}
        aria-hidden="true"
        focusable="false"
      />
      <span className={styles.correspondenceEnhet}>{enhet.navn}</span>
      <span className={styles.correspondenceTo}>
        <span className={styles.correspondenceLabel}>{directionLabel}:</span>
        <span>{party}</span>
      </span>
    </div>
  );
}

function PartyNameList({ names }: { names: string[] }) {
  const t = useTranslation();

  if (names.length === 0) {
    return null;
  }

  const [first, ...rest] = names;
  return (
    <>
      {first}
      {rest.length > 0 && (
        <span> {t('common.andMore', String(rest.length))}</span>
      )}
    </>
  );
}
