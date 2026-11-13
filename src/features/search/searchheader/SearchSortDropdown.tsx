'use client';

import { ArrowsUpDownIcon } from '@navikt/aksel-icons';
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

export default function SearchSortDropdown({
  className,
}: {
  className?: string;
}) {
  const t = useTranslation();
  const searchParams = useOptimisticSearchParams();
  const searchHref = useSearchHref();

  const sortParam = searchParams?.get('sort');
  const currentSort = isSortOption(sortParam) ? sortParam : DEFAULT_SORT;
  const getSortUrl = (sortKey: SortOption) => searchHref({ sort: sortKey });

  return (
    <EinDropdown
      trigger={
        <span className={styles.sortTrigger}>
          <ArrowsUpDownIcon
            aria-hidden="true"
            focusable="false"
            className={styles.sortIcon}
          />
          {t('searchFilters.sorting')}
        </span>
      }
      preferredPosition={[
        'belowRight',
        'belowLeft',
        'rightTop',
        'leftTop',
        'right',
        'left',
        'below',
        'above',
      ]}
      className={className}
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
          <EinLink
            href={getSortUrl(key)}
            aria-current={key === currentSort ? 'true' : undefined}
          >
            <span className={styles.sortOptionInner}>
              <span className={styles.radioIndicator} aria-hidden="true" />
              {t(`searchFilters.sortOptions.${key}`)}
            </span>
          </EinLink>
        </EinButton>
      ))}
    </EinDropdown>
  );
}
