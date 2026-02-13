'use client';

import { Button } from '@digdir/designsystemet-react';
import { MagnifyingGlassIcon, XMarkIcon } from '@navikt/aksel-icons';
import { useCallback, useRef, useState } from 'react';
import EnhetSelector from '~/components/SearchField/EnhetSelector';
import { useOnOutsideClick } from '~/hooks/useOnOutsideClick';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { EinButton } from '../EinButton/EinButton';
import styles from './SearchField.module.scss';
import { useSearchField } from './SearchFieldProvider';
import { StyledInput } from './StyledInput';

type SearchFieldProps = {
  className?: string;
};

export const SearchField = ({ className }: SearchFieldProps) => {
  const t = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const { searchQuery, setSearchQuery } = useSearchField();
  const [activeContainer, setActiveContainer] = useState<string | undefined>(
    undefined,
  );

  // Set focus to containing element when focusing on input
  const onContainerFocus = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      // Figure out which "section" got focus
      const target = event.target as HTMLDivElement;
      const container = target.closest(`.${styles.searchInputContainer}`);

      if (container?.matches(`.${styles.searchQueryContainer}`)) {
        setActiveContainer('searchQuery');
      } else if (container?.matches(`.${styles.enhetSelectorContainer}`)) {
        setActiveContainer('enhetSelector');
      } else {
        setActiveContainer(undefined);
      }
    },
    [],
  );

  // Remove focus on all containers when clicking outside
  const removeFocus = useCallback(() => {
    setActiveContainer(undefined);
  }, []);
  useOnOutsideClick(containerRef, removeFocus);

  const handleSearch = useCallback(() => {
    setSearchQuery(searchQuery, true);
  }, [setSearchQuery, searchQuery]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
  }, [setSearchQuery]);

  const closeEnhetSelector = useCallback(() => {
    setActiveContainer(undefined);
  }, []);

  const showClearButton =
    !!searchQuery && (!activeContainer || activeContainer === 'searchQuery');

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: This is not interactivity, just a handler for bubbled events.
    <div
      className={cn(styles.searchFieldContainer, className)}
      onFocus={onContainerFocus}
      ref={containerRef}
    >
      <div
        className={cn(
          styles.searchQueryContainer,
          styles.searchInputContainer,
          styles.searchInputWithIcon,
          { [styles.activeContainer]: activeContainer === 'searchQuery' },
        )}
      >
        <div className={cn(styles.expandableInputContainer)}>
          <StyledInput
            icon={<MagnifyingGlassIcon className={cn(styles.searchIcon)} />}
            value={searchQuery}
            setValue={setSearchQuery}
            name="q"
          />

          {showClearButton && (
            <Button
              className={cn(styles.clearButton)}
              type="button"
              onClick={handleClear}
              aria-label={t('search.clear')}
              variant="tertiary"
            >
              <XMarkIcon
                title={t('search.clear')}
                className={cn(styles.clearIcon)}
              />
            </Button>
          )}
        </div>
      </div>

      <div className={styles.spacer} />

      <div
        className={cn(
          styles.enhetSelectorContainer,
          styles.searchInputContainer,
          styles.searchInputWithIcon,
          { [styles.activeContainer]: activeContainer === 'enhetSelector' },
        )}
      >
        <div className={cn(styles.expandableInputContainer)}>
          <EnhetSelector
            expanded={activeContainer === 'enhetSelector'}
            close={closeEnhetSelector}
          />
        </div>
      </div>

      <div
        className={cn(styles.actionButtonContainer, {
          [styles.withBorder]: !!searchQuery,
        })}
      >
        <EinButton variant="primary" type="submit" onClick={handleSearch}>
          {t('search.button')}
        </EinButton>
      </div>
    </div>
  );
};
