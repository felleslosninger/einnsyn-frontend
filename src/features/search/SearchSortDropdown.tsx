'use client';

import { EinButton } from '~/components/EinButton/EinButton';
import { EinDropdown } from '~/components/EinDropdown';
import { EinLink } from '~/components/EinLink/EinLink';
import { useOptimisticSearchParams } from '~/components/NavigationProvider/NavigationProvider';
import { useSearchHref } from '~/hooks/useSearchHref';
import { useTranslation } from '~/hooks/useTranslation';
import {
  DEFAULT_SORT,
  isSortOption,
  SORT_OPTIONS,
  type SortOption,
} from '~/lib/routing/searchParams';
import cn from '~/lib/utils/className';
import styles from './SearchSortDropdown.module.scss';

export default function SearchSortDropdown() {
  const t = useTranslation();
  const searchParams = useOptimisticSearchParams();
  const searchHref = useSearchHref();

  const sortParam = searchParams?.get('sort');
  const currentSort = isSortOption(sortParam) ? sortParam : DEFAULT_SORT;
  const getSortUrl = (sortKey: SortOption) => searchHref({ sort: sortKey });

  return (
    <div className={styles.sortContainer} data-size="sm">
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
            <EinLink href={getSortUrl(key)}>
              <span className={styles.sortOptionInner}>
                <span className={styles.radioIndicator} aria-hidden="true" />
                {t(`searchFilters.sortOptions.${key}`)}
              </span>
            </EinLink>
          </EinButton>
        ))}
      </EinDropdown>
    </div>
  );
}
