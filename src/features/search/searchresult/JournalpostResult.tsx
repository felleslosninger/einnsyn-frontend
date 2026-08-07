import { isEnhet, type Journalpost } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { getEnhetHref, getName } from '~/lib/utils/enhetUtils';
import SearchResultSubheader from './common/SearchResultSubheader';

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
  const recordedDate = item.journaldato
    ? dateFormat(item.journaldato, languageCode)
    : undefined;

  return (
    <div className={cn(className, 'search-result', 'journalpost-result')}>
      <EinLink href="">
        <h2 className="ds-heading">{item.offentligTittel}</h2>
      </EinLink>
      <div className="ds-paragraph search-result-body">
        <SearchResultSubheader
          variant="journalpost"
          item={item}
          label={translate('journalpost.label')}
        >
          {saksnummer && (
            <span className="search-result-number">
              {translate('common.number')} {saksnummer}
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
        {/* TODO: implement open document functionality
        <a href="http://localhost:3000" className="search-result-action" target="_blank" rel="noopener noreferrer">
          {translate('search.openDocument')}
        </a> */}
        {/* TODO: implement order access functionality
        <EinLink href="http://localhost:3000" className="search-result-action">
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
  const languageCode = useLanguageCode();
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

  const enhetNavn = getName(enhet, languageCode);
  const enhetHref = getEnhetHref(enhet);
  const from = t('journalpost.from');
  const to = t('journalpost.to');
  const isIncoming = journalpost.journalposttype === 'inngaaende_dokument';
  const isOutgoing = journalpost.journalposttype === 'utgaaende_dokument';
  const enhetNode = (
    <EinLink href={enhetHref} className="correspondence-enhet">
      {enhetNavn}
    </EinLink>
  );

  return (
    <div className="search-result-correspondence">
      {isIncoming && (
        <>
          <span className="correspondence-direction">{to}: </span>
          {enhetNode} <span className="correspondence-direction">{from}: </span>
          <PartyNameList names={partyNames(/^[Aa]vsender$/)} />
        </>
      )}
      {isOutgoing && (
        <>
          <span className="correspondence-direction">{from}: </span>
          {enhetNode} <span className="correspondence-direction">{to}: </span>
          <PartyNameList names={partyNames(/^[Mm]ottaker$/)} />
        </>
      )}
      {!isIncoming && !isOutgoing && enhetNode}
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
