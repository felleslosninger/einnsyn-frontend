'use client';

import { useCallback } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import { SearchFieldClearButton } from './SearchFieldClearButton';
import type { EnhetSelectorState } from './useEnhetSelectorState';

type Props = {
  className?: string;
  state: EnhetSelectorState;
  active: boolean;
  // This button unmounts once the selection is empty, so keyboard focus
  // moves here.
  focusAfterClearRef: React.RefObject<HTMLElement | null>;
};

export function EnhetSelectorClearButton({
  className,
  state,
  active,
  focusAfterClearRef,
}: Props) {
  const t = useTranslation();
  const { clearSelected } = state;

  // A mouse click leaves focus where it was: nowhere in the field when
  // closed, in the filter input when open.
  const onMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  const onClick = useCallback(
    (event: React.MouseEvent) => {
      if (active) {
        // Only clear the draft. EinPopup's document click listener would
        // apply it and close.
        event.nativeEvent.stopImmediatePropagation();
      }
      clearSelected();
      // `detail` is 0 when activated from the keyboard.
      if (!active && event.detail === 0) {
        focusAfterClearRef.current?.focus();
      }
    },
    [active, clearSelected, focusAfterClearRef],
  );

  return (
    <SearchFieldClearButton
      className={className}
      label={t('search.clearEnhetSelection')}
      onClick={onClick}
      onMouseDown={onMouseDown}
    />
  );
}
