import { Fragment, forwardRef, useCallback, useMemo } from 'react';

import cn from '~/lib/utils/className';
import { searchQueryToTokens } from '~/lib/utils/searchStringTokenizer';
import styles from './StyledInput.module.scss';

type StyledInputProps = {
  className?: string;
  setValue: (value: string) => void;
  icon?: React.ReactNode;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const StyledInput = forwardRef<HTMLTextAreaElement, StyledInputProps>(
  (
    {
      className,
      icon,
      onInput,
      onKeyDown,
      placeholder,
      value,
      setValue,
      ...inputProps
    },
    ref,
  ) => {
    const searchQuery = typeof value === 'string' ? value : '';
    const searchTokens = useMemo(
      () => searchQueryToTokens((value || '').toString()),
      [value],
    );

    const onInputWrapper = useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        onInput?.(event);
        const target = event.target as HTMLTextAreaElement;
        setValue(target.value ?? '');
        target.style.height = `${target.scrollHeight}px`;
      },
      [setValue, onInput],
    );

    const onKeyDownWrapper = useCallback(
      (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const target = event.target as HTMLTextAreaElement;
        onKeyDown?.(event);

        // Trigger search on Enter key
        if (event.key === 'Enter') {
          event.preventDefault();
          target.blur();
        }
        // Update search query without search on other keys
        else {
          setValue(event.currentTarget.value ?? '');
        }
      },
      [onKeyDown, setValue],
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

    return (
      <div
        className={cn(
          styles.styledInputContainer,
          { [styles.hasIcon]: !!icon },
          className,
        )}
      >
        {icon && <div className={cn(styles.iconContainer)}>{icon}</div>}

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
          placeholder={placeholder}
          spellCheck="false"
          autoCorrect="off"
          autoCapitalize="none"
          {...inputProps}
        />
      </div>
    );
  },
);
