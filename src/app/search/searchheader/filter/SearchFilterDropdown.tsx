'use client';

import { useCallback, useEffect } from 'react';
import { EinDropdown } from '~/components/EinDropdown';
import { useSearchField } from '~/components/SearchField/SearchFieldProvider';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { BooleanFilter } from './BooleanFilter';
import { DateFilter } from './DateFilter';
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
  const { getProperty, setProperty } = useSearchField();

  const setPublisertDato = useCallback(
    (value: string | undefined) => setProperty('publisertDato', value),
    [setProperty],
  );

  const setOppdatertDato = useCallback(
    (value: string | undefined) => setProperty('oppdatertDato', value),
    [setProperty],
  );

  const setMoeteDato = useCallback(
    (value: string | undefined) => setProperty('moeteDato', value),
    [setProperty],
  );

  const setJournalposttype = useCallback(
    (value: string | undefined) => setProperty('journalpostType', value),
    [setProperty],
  );

  return (
    <EinDropdown
      trigger={t('common.filter')}
      showChevron={true}
      closeOnItemClick={false}
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
      className={cn(styles.filterDropdown, 'filter-dropdown', className)}
    >
      <DateFilter
        label={t('searchFilters.publisertDato')}
        initialValue={getProperty('publisertDato')}
        setValue={setPublisertDato}
      />
      <DateFilter
        label={t('searchFilters.oppdatertDato')}
        initialValue={getProperty('oppdatertDato')}
        setValue={setOppdatertDato}
      />
      <DateFilter
        label={t('searchFilters.moeteDato')}
        initialValue={getProperty('moeteDato')}
        setValue={setMoeteDato}
      />

      <div className="spacer" />

      <EnumFilter
        label={t('searchFilters.journalpostType')}
        setValue={setJournalposttype}
        options={[
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
        ]}
      />
      <BooleanFilter label={t('searchFilters.fullTextOnly')} property="ft" />
    </EinDropdown>
  );
}
