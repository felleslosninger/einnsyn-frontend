import { forwardRef } from 'react';

type StyledInputProps = {
  className?: string;
  searchTokens: string[];
};

export const StyledInput = forwardRef<HTMLTextAreaElement, StyledInputProps>(
  ({ className, searchTokens }, ref) => {
    return (
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
    );
  },
);
