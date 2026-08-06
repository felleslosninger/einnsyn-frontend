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

export type SearchResultVariant =
  | 'saksmappe'
  | 'journalpost'
  | 'moetemappe'
  | 'moetesak';

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
    <div className="search-result-subheader">
      <span
        className={cn('search-result-dot', `search-result-dot--${variant}`)}
        aria-hidden="true"
      />
      <span className="search-result-type">{capitalize(label)}</span>
      <span className="search-result-meta">
        {children}
        {publishedDate && (
          <span className="search-result-published-date">
            {capitalize(t('common.publishedAt'))} {publishedDate}
          </span>
        )}
      </span>
    </div>
  );
}
