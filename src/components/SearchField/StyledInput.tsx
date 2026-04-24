import {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import cn from '~/lib/utils/className';
import {
  domTransitionDuration,
  domTransitionend,
} from '~/lib/utils/domTransitionend';
import { searchQueryToTokens } from '~/lib/utils/searchStringTokenizer';
import styles from './StyledInput.module.scss';

type StyledInputProps = {
  className?: string;
  setValue: (value: string) => void;
  icon?: React.ReactNode;
  expandInFlow?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const StyledInput = forwardRef<HTMLTextAreaElement, StyledInputProps>(
  (
    {
      className,
      icon,
      expandInFlow = false,
      onBlur,
      onFocus,
      onInput,
      onKeyDown,
      placeholder,
      value,
      setValue,
      ...inputProps
    },
    ref,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const widthLockCleanupRef = useRef<(() => void) | null>(null);
    const searchQuery = typeof value === 'string' ? value : '';
    const searchTokens = useMemo(
      () => searchQueryToTokens((value || '').toString()),
      [value],
    );

    const updateExpandableContainerHeight = useCallback(
      (target: HTMLTextAreaElement, height: number | undefined) => {
        const expandableContainer = target.closest(
          '[data-styled-input-expandable="true"]',
        ) as HTMLElement | null;

        if (!expandableContainer) {
          return;
        }

        if (height === undefined) {
          expandableContainer.style.removeProperty(
            '--styled-input-expanded-height',
          );
          return;
        }

        expandableContainer.style.setProperty(
          '--styled-input-expanded-height',
          `${height}px`,
        );
      },
      [],
    );

    const updateFlowContainerHeight = useCallback(
      (target: HTMLTextAreaElement, height: number | undefined) => {
        const styledInputContainer = target.closest(
          `.${styles.styledInputContainer}`,
        ) as HTMLElement | null;

        if (!styledInputContainer) {
          return;
        }

        if (height === undefined) {
          styledInputContainer.style.removeProperty(
            '--styled-input-flow-height',
          );
          return;
        }

        styledInputContainer.style.setProperty(
          '--styled-input-flow-height',
          `${height}px`,
        );
      },
      [],
    );

    const resizeTextarea = useCallback(
      (target: HTMLTextAreaElement) => {
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
        const currentHeight = target.offsetHeight;
        updateExpandableContainerHeight(target, currentHeight);
        if (expandInFlow) {
          updateFlowContainerHeight(target, currentHeight);
        }
      },
      [
        expandInFlow,
        updateExpandableContainerHeight,
        updateFlowContainerHeight,
      ],
    );

    const resizeIfExpanded = useCallback(
      (target: HTMLTextAreaElement) => {
        const isFocused = document.activeElement === target;
        const hasInlineHeight = target.style.height !== '';
        if (!isFocused && !hasInlineHeight) {
          return;
        }

        resizeTextarea(target);
      },
      [resizeTextarea],
    );

    const clearWidthLock = useCallback(() => {
      widthLockCleanupRef.current?.();
      widthLockCleanupRef.current = null;
    }, []);

    const lockWidthDuringTransition = useCallback(
      (target: HTMLTextAreaElement): boolean => {
        clearWidthLock();

        const styledInputContainer = target.closest(
          `.${styles.styledInputContainer}`,
        ) as HTMLElement | null;
        const widthAnimatedContainer = target.closest(
          '[data-styled-input-width-animated="true"]',
        ) as HTMLElement | null;
        if (!styledInputContainer || !widthAnimatedContainer) {
          return false;
        }

        const width = target.getBoundingClientRect().width;
        if (width <= 0) {
          return false;
        }

        const hasMinWidthTransition =
          domTransitionDuration(widthAnimatedContainer, 'min-width') > 0;
        if (!hasMinWidthTransition) {
          return false;
        }

        styledInputContainer.dataset.widthLocked = 'true';
        styledInputContainer.style.setProperty(
          '--styled-input-locked-width',
          `${width}px`,
        );

        let released = false;
        let lockedWidth = width;
        const widthObserver = new ResizeObserver(() => {
          const nextWidth = styledInputContainer.getBoundingClientRect().width;
          if (nextWidth > lockedWidth + 0.5) {
            lockedWidth = nextWidth;
            styledInputContainer.style.setProperty(
              '--styled-input-locked-width',
              `${nextWidth}px`,
            );
          }
        });

        const release = () => {
          if (released) {
            return;
          }
          released = true;

          widthObserver.disconnect();
          delete styledInputContainer.dataset.widthLocked;
          styledInputContainer.style.removeProperty(
            '--styled-input-locked-width',
          );

          if (target.isConnected) {
            requestAnimationFrame(() => {
              resizeIfExpanded(target);
            });
          }

          if (widthLockCleanupRef.current === release) {
            widthLockCleanupRef.current = null;
          }
        };

        widthObserver.observe(widthAnimatedContainer);

        widthLockCleanupRef.current = release;
        void domTransitionend(widthAnimatedContainer, 'min-width').then(
          release,
          release,
        );
        return true;
      },
      [clearWidthLock, resizeIfExpanded],
    );

    const onInputWrapper = useCallback(
      (event: React.InputEvent<HTMLTextAreaElement>) => {
        onInput?.(event);
        const target = event.currentTarget;
        setValue(target.value ?? '');
        resizeTextarea(target);
      },
      [setValue, onInput, resizeTextarea],
    );

    const onKeyDownWrapper = useCallback(
      (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const target = event.target as HTMLTextAreaElement;
        onKeyDown?.(event);

        if (event.defaultPrevented) {
          return;
        }

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
        const lockedDuringTransition = lockWidthDuringTransition(target);
        onFocus?.(event);
        if (!lockedDuringTransition) {
          requestAnimationFrame(() => {
            resizeTextarea(target);
          });
        }
      },
      [lockWidthDuringTransition, onFocus, resizeTextarea],
    );

    const onTextareaFocusBlur = useCallback(
      (event: React.FocusEvent<HTMLTextAreaElement>) => {
        onBlur?.(event);
        clearWidthLock();
        const target = event.target as HTMLTextAreaElement;
        target.style.height = '';
        updateExpandableContainerHeight(target, undefined);
        updateFlowContainerHeight(target, undefined);
      },
      [
        clearWidthLock,
        onBlur,
        updateExpandableContainerHeight,
        updateFlowContainerHeight,
      ],
    );

    const setTextareaRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        textareaRef.current = node;

        if (typeof ref === 'function') {
          ref(node);
          return;
        }

        if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
            node;
        }
      },
      [ref],
    );

    useLayoutEffect(() => {
      const target = textareaRef.current;
      if (!target) {
        return;
      }

      if (target.value !== searchQuery) {
        return;
      }

      resizeIfExpanded(target);
    }, [searchQuery, resizeIfExpanded]);

    useLayoutEffect(() => {
      const target = textareaRef.current;
      if (!target || typeof ResizeObserver === 'undefined') {
        return;
      }

      let frameId: number | undefined;
      let lastWidth = target.getBoundingClientRect().width;

      const observer = new ResizeObserver((entries) => {
        const nextWidth = entries[0]?.contentRect.width ?? lastWidth;
        if (Math.abs(nextWidth - lastWidth) < 0.5) {
          return;
        }

        lastWidth = nextWidth;
        if (frameId !== undefined) {
          cancelAnimationFrame(frameId);
        }
        frameId = requestAnimationFrame(() => {
          resizeIfExpanded(target);
        });
      });

      observer.observe(target);

      return () => {
        if (frameId !== undefined) {
          cancelAnimationFrame(frameId);
        }
        observer.disconnect();
      };
    }, [resizeIfExpanded]);

    useEffect(() => {
      return () => {
        clearWidthLock();
      };
    }, [clearWidthLock]);

    return (
      <div
        className={cn(
          styles.styledInputContainer,
          {
            [styles.hasIcon]: !!icon,
            [styles.expandInFlow]: expandInFlow,
          },
          className,
        )}
      >
        {icon && <div className={cn(styles.iconContainer)}>{icon}</div>}

        <div className={cn(styles.styledInput, className)}>
          {searchTokens.map((token, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: StyledInput tokens are derived directly from the query string and do not have a stable identifier.
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
          ref={setTextareaRef}
          rows={1}
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
