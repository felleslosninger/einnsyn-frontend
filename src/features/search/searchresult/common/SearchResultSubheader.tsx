import type {
  Journalpost,
  Moetemappe,
  Moetesak,
  Saksmappe,
} from '@digdir/einnsyn-sdk';
import { EinMetaRow } from '~/components/EinMetaRow/EinMetaRow';
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
      <EinMetaRow className={styles.searchResultMeta}>
        {capitalize(label)}
        {children}
        {publishedDate &&
          `${capitalize(t('common.publishedAt'))} ${publishedDate}`}
      </EinMetaRow>
    </div>
  );
}
