'use client';

import type { RefObject } from 'react';
import useBreakpoint from '~/hooks/useBreakpoint';
import cn from '~/lib/utils/className';
import styles from './EnhetSelector.module.scss';
import { EnhetSelectorDesktop } from './EnhetSelectorDesktop';
import { EnhetSelectorMobile } from './EnhetSelectorMobile';
import { useEnhetSelectorState } from './useEnhetSelectorState';

type EnhetSelectorProps = {
  className?: string;
  active: boolean;
  activate: () => void;
  close: () => void;
  // The whole search bar; the desktop popup spans and hangs from it.
  popupAnchorRef?: RefObject<HTMLElement | null>;
  // Holds the unapplied selection while the selector is open, null otherwise.
  draftRef?: RefObject<readonly string[] | null>;
};

/**
 * Picks between two visually distinct presentations of the same selection:
 *
 * - **Desktop**: an anchored popup with a two-column "available / selected"
 *   layout. Changes buffer in a draft until the user clicks "Bruk valg".
 * - **Mobile**: a bottom-sheet modal with a flat list. Changes commit when the
 *   sheet closes.
 *
 * List navigation keys are bound on the filter input itself (see
 * `onInputKeyDown` in `useEnhetSelectorState`), so Tab can move focus to
 * other dialog controls without our handler intercepting their keys.
 */
export default function EnhetSelector({
  className,
  active,
  activate,
  close,
  popupAnchorRef,
  draftRef,
}: EnhetSelectorProps) {
  const isMobileLayout = useBreakpoint('SM');
  const state = useEnhetSelectorState({
    active,
    close,
    isMobileLayout,
    draftRef,
  });

  return (
    <div className={cn(styles.enhetSelector, className)}>
      {isMobileLayout ? (
        <EnhetSelectorMobile
          state={state}
          active={active}
          activate={activate}
          close={close}
        />
      ) : (
        <EnhetSelectorDesktop
          state={state}
          active={active}
          activate={activate}
          close={close}
          popupAnchorRef={popupAnchorRef}
        />
      )}
    </div>
  );
}
