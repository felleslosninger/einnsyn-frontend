'use client';

import { EinButton } from '~/components/EinButton/EinButton';
import { EinDropdown } from '~/components/EinDropdown';
import { EinLink } from '~/components/EinLink/EinLink';
import {
  useOptimisticPathname,
  useOptimisticSearchParams,
} from '~/components/NavigationProvider/NavigationProvider';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './SearchSortDropdown.module.scss';

const SORT_OPTIONS = [
  'score',
  'publisertDatoDesc',
  'publisertDatoAsc',
  'oppdatertDatoDesc',
  'oppdatertDatoAsc',
  'offentligTittelAsc',
  'offentligTittelDesc',
  'enhetAsc',
  'enhetDesc',
] as const;

export default function SearchSortDropdown({
  options = SORT_OPTIONS,
  defaultOption = 'score',
  translationPrefix = 'searchFilters.sortOptions',
}: {
  options?: readonly string[];
  defaultOption?: string;
  translationPrefix?: string;
}) {
  const t = useTranslation();
  const searchParams = useOptimisticSearchParams();
  const pathname = useOptimisticPathname();

  const sortParam = searchParams?.get('sort');
  const currentSort =
    sortParam && options.includes(sortParam) ? sortParam : defaultOption;

  const getSortUrl = (sortKey: string) => {
    const p = new URLSearchParams(searchParams ?? undefined);
    if (sortKey === defaultOption) {
      p.delete('sort');
    } else {
      p.set('sort', sortKey);
    }
    const query = p.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <div className={styles.sortContainer} data-size="sm">
      <EinDropdown
        trigger={
          <span className={styles.sortTrigger}>
            <span className={styles.prefix}>{t('search.sortedBy')}:</span>
            {t(`${translationPrefix}.${currentSort}`)}
          </span>
        }
        triggerClassName={styles.triggerButton}
        showChevron
      >
        {options.map((key) => (
          <EinButton
            key={key}
            asChild
            variant="tertiary"
            data-color="neutral"
            className={cn(styles.sortOption, {
              [styles.active]: key === currentSort,
            })}
          >
            <EinLink href={getSortUrl(key)}>
              <span className={styles.sortOptionInner}>
                <span className={styles.radioIndicator} aria-hidden="true" />
                {t(`${translationPrefix}.${key}`)}
              </span>
            </EinLink>
          </EinButton>
        ))}
      </EinDropdown>
    </div>
  );
}
