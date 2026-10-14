import { isSaksmappe, type Journalpost } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';
import { Korrespondansepart } from '~/features/entities/journalpost/Korrespondansepart';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { useJournalpostURLGenerator } from '~/lib/utils/urlGenerators';
import SaksmappeLink from './common/SaksmappeLink';
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
  const journalpostURL = useJournalpostURLGenerator();
  const saksnummer = getSaksnummer(item);
  const journaldato = item.journaldato
    ? dateFormat(item.journaldato, languageCode)
    : undefined;

  return (
    <div className={cn(className, styles.searchResult, 'journalpost-result')}>
      <EinLink href={journalpostURL(item)}>
        <h2 className="ds-heading">{item.offentligTittel}</h2>
      </EinLink>
      <div className={cn('ds-paragraph', styles.searchResultBody)}>
        <SearchResultSubheader
          variant="journalpost"
          item={item}
          label={translate('journalpost.label')}
        >
          {saksnummer && (
            <span>
              {translate('common.number')}{' '}
              {isSaksmappe(item.saksmappe) ? (
                <SaksmappeLink saksmappe={item.saksmappe} />
              ) : (
                saksnummer
              )}
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
        <Korrespondansepart journalpost={item} />
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
