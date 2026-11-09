import type {
  Journalpost,
  Moetemappe,
  Moetesak,
  Saksmappe,
} from '@digdir/einnsyn-sdk';
import { EinMetaRow } from '~/components/EinMetaRow/EinMetaRow';
import { EntityDot } from '~/components/EntityDot/EntityDot';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import { dateFormat } from '~/lib/utils/dateFormat';
import { capitalize } from '~/lib/utils/stringutils';
import styles from '../searchResultStyles.module.scss';

export default function SearchResultSubheader({
  label,
  item,
  children,
}: {
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
      <EntityDot entity={item.entity} className={styles.searchResultDot} />
      <EinMetaRow className={styles.searchResultMeta}>
        {capitalize(label)}
        {children}
        {publishedDate &&
          `${capitalize(t('common.publishedAt'))} ${publishedDate}`}
      </EinMetaRow>
    </div>
  );
}
