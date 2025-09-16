'use client';

import { Fragment, forwardRef, useCallback } from 'react';
import { SearchClear, Button } from '@digdir/designsystemet-react';
import cn from '~/lib/utils/className';
import styles from './SearchField.module.scss';
import { useSearchField } from './SearchFieldProvider';
import { MultiplyIcon, MagnifyingGlassIcon } from '@navikt/aksel-icons';

type SearchFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ children, className, ...inputProps }, ref) => {
    const { searchTokens, searchQuery, setSearchQuery, clearSearch } = useSearchField();

    const onInput = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        inputProps.onInput?.(event);
        setSearchQuery(event.currentTarget.value ?? '');
      },
      [setSearchQuery, inputProps.onInput],
    );

    return (
      <div className={cn(styles.searchFieldContainer)}>
        <MagnifyingGlassIcon className={cn(styles.searchIcon)} />
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
          {...inputProps}
        />
        {searchQuery && (
          <Button
            className={cn(styles.clearButton)}
            type="reset"
            onClick={clearSearch}
            aria-label="Clear search"
            variant='tertiary'
          >
            <MultiplyIcon title='Clear search' />
          </Button>
        )}
      </div>
    );
  },
);

SearchField.displayName = 'SearchField';

export default SearchField;