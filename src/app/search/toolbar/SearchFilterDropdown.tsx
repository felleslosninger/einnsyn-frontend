'use client';

import { EinDropdown } from '~/components/EinDropdown';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { BooleanFilter } from './BooleanFilter';
import { EnumFilter } from './EnumFilter';
import styles from './SearchFilterDropdown.module.scss';

/**
 * SearchFilterDropdown Component
 *
 * Provides a nested dropdown interface for filtering search results.
 * The main "Filter" button opens a menu containing all available filter options,
 * each of which opens its own sub-dropdown with specific controls.
 *
 * Features:
 * - Entity-aware filtering (different filters for different content types)
 * - URL synchronization (filters persist in browser history)
 * - Nested dropdown structure for better UX
 * - Automatic translation support
 */
export default function SearchFilterDropdown({
  className,
}: {
  className?: string;
}) {
  const t = useTranslation();

  return (
    <div
      data-size="sm"
      className={cn(styles.searchToolbar, 'search-toolbar', className)}
    >
      <EinDropdown
        trigger={t('common.filter')}
        showChevron={true}
        closeOnItemClick={false}
        className={cn(styles.filterDropdown, 'filter-dropdown')}
      >
        {/* <DateRangeFilter
          label={t('searchFilters.publishedDate')}
          startProperty="pdf"
          endProperty="pde"
        />
        */}
        <EnumFilter
          label={t('searchFilters.journalpostType')}
          property="jpt"
          options={[
            // { isAll: true, value: '', label: t('common.all') },
            {
              value: 'inngaaende',
              label: t('searchFilters.journalpostTypes.inngaaende'),
            },
            {
              value: 'utgaaende',
              label: t('searchFilters.journalpostTypes.utgaaende'),
            },
            {
              value: 'organinternt',
              label: t('searchFilters.journalpostTypes.organinternt'),
            },
            {
              value: 'saksframlegg',
              label: t('searchFilters.journalpostTypes.saksframlegg'),
            },
            // {
            //   value: 'sakskart',
            //   label: t('searchFilters.journalpostTypes.sakskart'),
            // },
            // {
            //   value: 'moeteprotokoll',
            //   label: t('searchFilters.journalpostTypes.moeteprotokoll'),
            // },
            // {
            //   value: 'moetebok',
            //   label: t('searchFilters.journalpostTypes.moetebok'),
            // },
          ]}
        />
        <BooleanFilter label={t('searchFilters.fullTextOnly')} property="ft" />
      </EinDropdown>
    </div>
  );
}
