'use client';

import { useMemo } from 'react';
import {
  EinTransition,
  type EinTransitionEvents,
} from '~/components/EinTransition/EinTransition';
import cn from '~/lib/utils/className';
import styles from './EinExpandable.module.scss';

// Duration of the expand/collapse, published to the stylesheet as
// `--expandable-duration`. `useScrollToExpanded` glides the scroll over the
// same interval.
export const EXPAND_DURATION_MS = 350;

// Measure the content's natural height and publish it as the pixel value the
// stylesheet's `height` transition animates to. The content overflows the
// clipped root, so its rect reports the full height even at `height: 0`.
function publishHeight(expandable: HTMLElement): number {
  const content = expandable.querySelector<HTMLElement>(`.${styles.content}`);
  const height = content?.getBoundingClientRect().height ?? 0;
  expandable.style.setProperty('--expandable-height', `${height}px`);
  return height;
}

/**
 * A panel that animates open/closed as `expanded` mounts/unmounts its
 * children, by measuring the content's end height and transitioning `height`
 * to it. The root carries `data-expandable` so `useScrollToExpanded` can
 * account for sibling panels mid-transition.
 */
export function EinExpandable({
  expanded,
  onExpand,
  className,
  contentClassName,
  children,
}: {
  expanded: boolean;
  // Fired as the opening transition starts, with the measured content height.
  onExpand?: (expandable: HTMLElement, contentHeight: number) => void;
  className?: string;
  contentClassName?: string;
  children?: React.ReactNode;
}) {
  const events = useMemo<EinTransitionEvents<boolean[]>>(
    () => ({
      // Exit needs a concrete start value — `height` can't animate from `auto`.
      onInitExitTransition: (expandable) => {
        publishHeight(expandable);
      },
      onEnterTransition: (expandable) => {
        onExpand?.(expandable, publishHeight(expandable));
      },
    }),
    [onExpand],
  );

  return (
    <EinTransition dependencies={[expanded]} withClassNames events={events}>
      {expanded ? (
        <div
          className={cn(styles.expandable, className)}
          data-expandable=""
          style={
            {
              '--expandable-duration': `${EXPAND_DURATION_MS}ms`,
            } as React.CSSProperties
          }
        >
          <div className={cn(styles.content, contentClassName)}>{children}</div>
        </div>
      ) : null}
    </EinTransition>
  );
}
