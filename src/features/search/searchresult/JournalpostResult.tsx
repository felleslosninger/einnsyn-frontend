import { isEnhet, type Journalpost } from '@digdir/einnsyn-sdk';
import { Buildings3Icon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import SearchResultSubheader from './common/SearchResultSubheader';

function getFirstDocumentUrl(item: Journalpost): string | null {
  for (const dok of item.dokumentbeskrivelse ?? []) {
    if (typeof dok === 'string') continue;
    for (const obj of dok.dokumentobjekt ?? []) {
      if (typeof obj === 'string') continue;
      if (!obj.url) continue;
      const iri = obj.referanseDokumentfil || obj.id;
      return `/fil?iri=${encodeURIComponent(iri)}`;
    }
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
  const documentUrl = getFirstDocumentUrl(item);
  const recordedDate = item.journaldato
    ? dateFormat(item.journaldato, languageCode)
    : undefined;

  return (
    <div className={cn(className, 'search-result', 'journalpost-result')}>
      <EinLink href="">
        <h2 className="ds-heading" data-size="sm">
          {item.offentligTittel}
        </h2>
      </EinLink>
      <div className="ds-paragraph search-result-body" data-size="sm">
        <SearchResultSubheader
          variant="journalpost"
          item={item}
          label={translate('journalpost.label')}
        >
          {item.journalpostnummer != null && (
            <span className="search-result-number">
              {translate('common.number')}{' '}
              {typeof item.saksmappe === 'object' && item.saksmappe?.saksnummer
                ? item.saksmappe.saksnummer
                : typeof item.saksmappe === 'string'
                  ? item.saksmappe
                  : null}
            </span>
          )}

          {item.journalposttype && (
            <span className="search-result-doctype">
              {translate(`journalpost.type.${item.journalposttype}`)}
            </span>
          )}
          {recordedDate && (
            <span className="search-result-recorded-date">
              {translate('common.recordedAt')} {recordedDate}
            </span>
          )}
        </SearchResultSubheader>
        <JournalpostCorrespondence journalpost={item} />
        {documentUrl ? (
          <a
            href={documentUrl}
            className="search-result-action"
            target="_blank"
            rel="noopener noreferrer"
          >
            {translate('search.openDocument')}
          </a>
        ) : (
          <EinLink href="" className="search-result-action">
            {translate('search.orderAccess')}
          </EinLink>
        )}
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
      <div className="search-result-enhet">
        <Buildings3Icon aria-hidden="true" focusable="false" />
        {enhet.navn}
      </div>
    );
  }

  return (
    <div className="search-result-correspondence">
      <Buildings3Icon
        className="correspondence-icon"
        aria-hidden="true"
        focusable="false"
      />
      <span className="correspondence-enhet">{enhet.navn}</span>
      <span className="correspondence-to">
        <span className="correspondence-label">{directionLabel}:</span>
        <span className="correspondence-party">{party}</span>
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
        <span className="search-result-party-more">
          {' '}
          {t('common.andMore', String(rest.length))}
        </span>
      )}
    </>
  );
}
