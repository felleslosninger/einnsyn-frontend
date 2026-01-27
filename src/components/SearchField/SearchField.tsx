'use client';

import { Button } from '@digdir/designsystemet-react';
import {
  Buildings3Icon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@navikt/aksel-icons';
import { Fragment, forwardRef, useCallback, useRef, useState } from 'react';
import EnhetSelector from '~/components/SearchField/EnhetSelector';
import { useOnOutsideClick } from '~/hooks/useOnOutsideClick';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { EinButton } from '../EinButton/EinButton';
import styles from './SearchField.module.scss';
import { useSearchField } from './SearchFieldProvider';
import { useEnhetSelector } from './useEnhetSelector';

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

    const enhetSelectorExpanded = activeContainer === 'enhetSelector';
    const { label: enhetSelectorLabel, selector: enhetSelector } =
      useEnhetSelector({
        expanded: enhetSelectorExpanded,
        close: () => setActiveContainer(undefined),
      });

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

        console.log('onContainerFocus ' + container?.className);
        console.log(event.target.className);
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

    return (
      <div className={cn(styles.searchFieldAnchor, 'search-field-anchor')}>
        <div
          className={cn(styles.searchFieldContainer, 'search-field-container')}
          ref={containerRef}
        >
          <div
            className={cn(
              styles.searchInputAndButtonContainer,
              'search-input-and-button-container',
            )}
          >
            {/** biome-ignore lint/a11y/noStaticElementInteractions: Allow handler for bubbled events */}
            <div
              className={cn(styles.searchField, 'search-field')}
              onFocus={onContainerFocus}
            >
              <div
                className={cn(
                  styles.searchQueryContainer,
                  styles.searchInputContainer,
                  styles.searchInputWithIcon,
                  {
                    [styles.activeContainer]: activeContainer === 'searchQuery',
                  },
                )}
              >
                <div
                  className={cn(
                    styles.searchIconContainer,
                    styles.searchInputIcon,
                  )}
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

              <div className={styles.spacer} />

              <div
                className={cn(
                  styles.enhetSelectorContainer,
                  styles.searchInputContainer,
                  styles.searchInputWithIcon,
                  {
                    [styles.activeContainer]: enhetSelectorExpanded,
                  },
                )}
              >
                <EinButton
                  style="link"
                  className={cn(
                    styles.paddedContent,
                    styles.enhetSelectorButton,
                  )}
                >
                  <div className={cn(styles.searchInputIcon)}>
                    <Buildings3Icon
                      className={cn(styles.searchIcon)}
                      title="Enhet"
                      fontSize="1.2rem"
                    />
                  </div>
                  {enhetSelectorLabel}
                </EinButton>
              </div>
            </div>

            <div
              className={cn(
                styles.actionContainer,
                'search-field-action-container',
              )}
            >
              <div
                className={cn(styles.actionButtonContainer, {
                  [styles.withBorder]: !!searchQuery,
                })}
              >
                <EinButton
                  variant="primary"
                  type="submit"
                  onClick={handleSearch}
                >
                  {t('search.button')}
                </EinButton>
              </div>
            </div>
          </div>

          <div
            className={cn(
              styles.dropdownContainer,
              'search-field-dropdown-container',
            )}
          >
            {enhetSelectorExpanded && enhetSelector}
          </div>
        </div>
      </div>
    );
  },
);

SearchField.displayName = 'SearchField';

export default SearchField;
