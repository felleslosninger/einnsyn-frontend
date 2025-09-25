'use client';

import { Fragment, forwardRef, useCallback } from 'react';
import { SearchClear, Button } from '@digdir/designsystemet-react';
import cn from '~/lib/utils/className';
import styles from './SearchField.module.scss';
import { useSearchField } from './SearchFieldProvider';
import { MultiplyIcon, MagnifyingGlassIcon } from '@navikt/aksel-icons';
import { useTranslation } from '~/hooks/useTranslation';

type SearchFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ children, className, ...inputProps }, ref) => {
    const t = useTranslation();
    const { searchTokens, searchQuery, setSearchQuery } = useSearchField();

    const onInput = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        inputProps.onInput?.(event);
        setSearchQuery(event.currentTarget.value ?? '');
      },
      [setSearchQuery, inputProps.onInput],
    );

    const handleSearch = useCallback(() => {
      setSearchQuery(searchQuery, true);
    }, [setSearchQuery, searchQuery]);

    const handleClear = useCallback(() => {
      setSearchQuery('');
    }, [setSearchQuery]);

    return (
      <div className={cn(styles.searchFieldContainer)}>
        <button
          className={cn(styles.searchIconButton)}
          type="submit"
          aria-label={t('search.button')}
          onClick={handleSearch}
        >
          <MagnifyingGlassIcon className={cn(styles.searchIcon)} />
        </button>

        <span className={cn(styles.inputContainer)}>
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
                    <span className={cn(styles.tokenSign)}>{token.sign}</span>
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
                {index < searchTokens.length - 1 && '\u00A0'}
              </Fragment>
            ))}
          </div>

          <input
            ref={ref}
            type="text"
            value={searchQuery}
            onInput={onInput}
            className={cn(styles.input, className)}
            placeholder={t('search.placeholder')}
            {...inputProps}
          />
        </span>

        {
          searchQuery && (
            <Button
              className={cn(styles.clearButton)}
              type="reset"
              onClick={handleClear}
              aria-label={t('search.clear')}
              variant='tertiary'
            >
              <MultiplyIcon title={t('search.clear')} className={cn(styles.clearIcon)} />
            </Button>
          )
        }
      </div >
    );
  },
);

SearchField.displayName = 'SearchField';

export default SearchField;