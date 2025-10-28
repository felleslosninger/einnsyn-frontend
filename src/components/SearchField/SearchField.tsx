'use client';

import { Button } from '@digdir/designsystemet-react';
import {
  Buildings3Icon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@navikt/aksel-icons';
import { Fragment, forwardRef, useCallback, useRef, useState } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './SearchField.module.scss';
import { useSearchField } from './SearchFieldProvider';
import { EinButton } from '../EinButton/EinButton';
import EnhetSelector from '~/features/search/searchheader/EnhetSelector';
import { useOnOutsideClick } from '~/hooks/useOnOutsideClick';

type SearchFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string;
};

export const SearchField = forwardRef<HTMLTextAreaElement, SearchFieldProps>(
  ({ children, className, onInput, onKeyDown, ...inputProps }, ref) => {
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
        console.log('FOCUS', container?.className);

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

    console.log('Active container:', activeContainer);
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

            <div className={cn(styles.styledInputContainer)}>
              <div className={cn(styles.styledInput, className)}>
                {searchTokens.map((token, index) => (
                  <Fragment key={`${index}-${token.value}`}>
                    <span
                      className={cn(styles.searchToken, {
                        [styles.prefixedToken]: !!token.prefix,
                        [styles.includeToken]: token.sign === '+',
                        [styles.excludeToken]: token.sign === '-',
                        [styles.quotedToken]: !!token.quoted,
                      })}
                    >
                      {token.sign && (
                        <span className={cn(styles.tokenSign)}>
                          {token.sign}
                        </span>
                      )}
                      {token.prefix && (
                        <span className={cn(styles.tokenPrefix)}>
                          {token.prefix}:
                        </span>
                      )}
                      <span className={cn(styles.tokenValue)}>
                        {token.quoted && '"'}
                        {token.value}
                        {token.quoted && '"'}
                      </span>
                    </span>
                    {index < searchTokens.length - 1 && ' '}
                  </Fragment>
                ))}
              </div>

              <textarea
                ref={ref}
                value={searchQuery}
                onInput={onInputWrapper}
                onKeyDown={onKeyDownWrapper}
                onFocus={onTextareaFocus}
                onBlur={onTextareaFocusBlur}
                className={cn(styles.input, className)}
                placeholder={t('search.placeholder')}
                spellCheck="false"
                autoCorrect="off"
                autoCapitalize="none"
                {...inputProps}
              />
            </div>

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
            <div
              className={cn(styles.searchIconContainer, styles.searchInputIcon)}
            >
              <Buildings3Icon
                className={cn(styles.searchIcon)}
                title="Enhet"
                fontSize="1.2rem"
              />
            </div>
            <EnhetSelector
              expanded={activeContainer === 'enhetSelector'}
              className={styles.paddedContent}
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
  },
);

SearchField.displayName = 'SearchField';

export default SearchField;
