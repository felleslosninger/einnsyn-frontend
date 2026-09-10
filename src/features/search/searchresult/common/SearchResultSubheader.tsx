import type {
  Journalpost,
  Moetemappe,
  Moetesak,
  Saksmappe,
} from '@digdir/einnsyn-sdk';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { capitalize } from '~/lib/utils/stringutils';
import styles from '../searchResultStyles.module.scss';

export type SearchResultVariant =
  | 'saksmappe'
  | 'journalpost'
  | 'moetemappe'
  | 'moetesak';

const dotVariantClass: Record<SearchResultVariant, string> = {
  saksmappe: styles.searchResultDotSaksmappe,
  journalpost: styles.searchResultDotJournalpost,
  moetemappe: styles.searchResultDotMoetemappe,
  moetesak: styles.searchResultDotMoetesak,
};

export default function SearchResultSubheader({
  variant,
  label,
  item,
  children,
}: {
  variant: SearchResultVariant;
  label: string;
  item: Journalpost | Saksmappe | Moetesak | Moetemappe;
  children?: React.ReactNode;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();

  const publishedDate = item.publisertDato
    ? dateFormat(item.publisertDato, languageCode)
    : undefined;

  return (
    <div className={styles.searchResultSubheader}>
      <span
        className={cn(styles.searchResultDot, dotVariantClass[variant])}
        aria-hidden="true"
      />
      {/* Inside the meta row, not beside it: the label is the first field of
          the same run, and the separators are drawn between its children. */}
      <span className={styles.searchResultMeta}>
        <span>{capitalize(label)}</span>
        {children}
        {publishedDate && (
          <span>
            {capitalize(t('common.publishedAt'))} {publishedDate}
          </span>
        )}
      </span>
    </div>
  );
}
