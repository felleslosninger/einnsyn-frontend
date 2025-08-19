'use client';

import { Fragment, forwardRef, useCallback } from 'react';
import cn from '~/lib/utils/className';
import styles from './SearchField.module.scss';
import { useSearchField } from './SearchFieldProvider';

type SearchFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ children, className, ...inputProps }, ref) => {
    const { searchTokens, searchQuery, setSearchQuery } = useSearchField();

    const onInput = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        inputProps.onInput?.(event);
        setSearchQuery(event.currentTarget.value ?? '');
      },
      [setSearchQuery, inputProps.onInput],
    );

    return (
      <div className={cn(styles.searchFieldContainer)}>
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
      </div>
    );
  },
);

SearchField.displayName = 'SearchField';

export default SearchField;
