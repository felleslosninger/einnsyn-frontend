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

type SearchFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string;
};

export const SearchField = ({
  className,
  onInput,
  onKeyDown,
  ...inputProps
}) => {
  const t = useTranslation();
  const { searchTokens, searchQuery, setSearchQuery } = useSearchField();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeContainer, setActiveContainer] = useState<string | undefined>(
    undefined,
  );
  const placeholder = t('search.placeholder');

  const onInputWrapper = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onInput?.(event);
      const target = event.target as HTMLTextAreaElement;
      setSearchQuery(target.value ?? '');
      target.style.height = `${target.scrollHeight}px`;
    },
    [setSearchQuery, onInput],
  );

  const onKeyDownWrapper = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const target = event.target as HTMLTextAreaElement;
      onKeyDown?.(event);

      // Trigger search on Enter key
      if (event.key === 'Enter') {
        event.preventDefault();
        setSearchQuery(event.currentTarget.value ?? '', true);
        target.blur();
      }
      // Update search query without search on other keys
      else {
        setSearchQuery(event.currentTarget.value ?? '', false);
      }
    },
    [onKeyDown, setSearchQuery],
  );

  // Expand textarea on focus.
  const onTextareaFocus = useCallback(
    (event: React.FocusEvent<HTMLTextAreaElement>) => {
      const target = event.target as HTMLTextAreaElement;
      target.style.height = `${target.scrollHeight}px`;
    },
    [],
  );

  const onTextareaFocusBlur = useCallback(
    (event: React.FocusEvent<HTMLTextAreaElement>) => {
      const target = event.target as HTMLTextAreaElement;
      target.style.height = '';
    },
    [],
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

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: This is not interactivity, just a handler for bubbled events.
    <div
      className={cn(styles.searchFieldContainer)}
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
          <div
            className={cn(styles.searchIconContainer, styles.searchInputIcon)}
          >
            <MagnifyingGlassIcon className={cn(styles.searchIcon)} />
          </div>

          <StyledInput name="q" />

          {searchQuery && (
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
