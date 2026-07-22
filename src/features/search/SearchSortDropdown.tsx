'use client';

import { EinButton } from '~/components/EinButton/EinButton';
import { EinDropdown } from '~/components/EinDropdown';
import {
  useOptimisticPathname,
  useOptimisticSearchParams,
} from '~/components/NavigationProvider/NavigationProvider';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './SearchSortDropdown.module.scss';

const SORT_OPTIONS = [
  'publisertDatoDesc',
  'publisertDatoAsc',
  'oppdatertDatoDesc',
  'oppdatertDatoAsc',
  'offentligTittelAsc',
  'offentligTittelDesc',
  'enhetAsc',
  'enhetDesc',
] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

const DEFAULT_SORT: SortOption = 'publisertDatoDesc';

export default function SearchSortDropdown() {
  const t = useTranslation();
  const searchParams = useOptimisticSearchParams();
  const pathname = useOptimisticPathname();

  const sortParam = searchParams?.get('sort');
  const currentSort: SortOption =
    sortParam && SORT_OPTIONS.includes(sortParam as SortOption)
      ? (sortParam as SortOption)
      : DEFAULT_SORT;
  const getSortUrl = (sortKey: SortOption) => {
    const p = new URLSearchParams(searchParams ?? undefined);
    p.set('sort', sortKey);
    return `${pathname}?${p.toString()}`;
  };

  return (
    <div className={styles.sortContainer}>
      <EinDropdown
        trigger={
          <span className={styles.sortTrigger}>
            <span className={styles.prefix}>{t('search.sortedBy')}:</span>
            {t(`searchFilters.sortOptions.${currentSort}`)}
          </span>
        }
        triggerClassName={styles.triggerButton}
        showChevron
      >
        {SORT_OPTIONS.map((key) => (
          <EinButton
            key={key}
            asChild
            variant="tertiary"
            data-color="neutral"
            className={cn(styles.sortOption, {
              [styles.active]: key === currentSort,
            })}
          >
            <a href={getSortUrl(key)}>
              <span className={styles.sortOptionInner}>
                <span className={styles.radioIndicator} aria-hidden="true" />
                {t(`searchFilters.sortOptions.${key}`)}
              </span>
            </a>
          </EinButton>
        ))}
      </EinDropdown>
    </div>
  );
}
