'use client';

import { Button } from '@digdir/designsystemet-react';
import {
  Buildings3Icon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@navikt/aksel-icons';
import { Fragment, forwardRef, useCallback } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from './SearchField.module.scss';
import { useSearchField } from './SearchFieldProvider';
import { EinButton } from '../EinButton/EinButton';
import EnhetSelector from '~/features/search/searchheader/EnhetSelector';

type SearchFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string;
};

export const SearchField = forwardRef<HTMLTextAreaElement, SearchFieldProps>(
  ({ children, className, onInput, onKeyDown, ...inputProps }, ref) => {
    const t = useTranslation();
    const { searchTokens, searchQuery, setSearchQuery } = useSearchField();
    const placeholder = t('search.placeholder');

    const onInputWrapper = useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        onInput?.(event);
        setSearchQuery(event.currentTarget.value ?? '');
      },
      [setSearchQuery, onInput],
    );

    const onKeyDownWrapper = (
      event: React.KeyboardEvent<HTMLTextAreaElement>,
    ) => {
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

      // Update height
      target.style.height = `${target.scrollHeight}px`;
    };

    // Expand textarea on focus.
    const onTextareaFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
      const target = event.target as HTMLTextAreaElement;
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    };

    const onTextareaFocusBlur = (
      event: React.FocusEvent<HTMLTextAreaElement>,
    ) => {
      const target = event.target as HTMLTextAreaElement;
      target.style.height = '';
    };

    const handleSearch = useCallback(() => {
      setSearchQuery(searchQuery, true);
    }, [setSearchQuery, searchQuery]);

    const handleClear = useCallback(() => {
      setSearchQuery('');
    }, [setSearchQuery]);

    return (
      <div className={cn(styles.searchFieldContainer)}>
        <div
          className={cn(
            styles.searchQueryContainer,
            styles.searchInputContainer,
          )}
        >
          <div className={cn(styles.expandableInputContainer)}>
            <div
              className={cn(styles.searchIconContainer, styles.searchInputIcon)}
            >
              <MagnifyingGlassIcon className={cn(styles.searchIcon)} />
            </div>

            <div
              className={cn(
                styles.styledInputContainer,
                styles.searchInputWithIcon,
              )}
            >
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
                autoCapitalize="off"
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
          )}
        >
          <Buildings3Icon title="Enhet" fontSize="1.2rem" />
          <EnhetSelector />
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
