'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { EinLink } from '~/components/EinLink/EinLink';
import styles from './HeaderTabs.module.scss';

export function HeaderTabs({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  // No deps: the active tab can only change when the children re-render.
  useLayoutEffect(() => {
    if (ref.current) {
      placeUnderline(ref.current);
    }
  });

  // Tabs also change width without a render, e.g. when the font loads.
  useEffect(() => {
    const tabs = ref.current;
    if (!tabs) {
      return;
    }
    const observer = new ResizeObserver(() => placeUnderline(tabs));
    for (const tab of tabs.querySelectorAll(':scope > a')) {
      observer.observe(tab);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.tabs}>
      {children}
      <span className={styles.underline} aria-hidden="true" />
    </div>
  );
}

// Sets the underline's target box and color; CSS transitions it there.
function placeUnderline(tabs: HTMLElement) {
  const active = tabs.querySelector(':scope > [aria-current]');
  if (!active) {
    return;
  }
  const rect = active.getBoundingClientRect();
  const { paddingLeft, paddingRight, columnGap } = getComputedStyle(active);
  // Same overhang as $underline-inset in HeaderTabs.module.scss.
  const overhang = Number.parseFloat(columnGap) / 2;
  const left =
    rect.left -
    tabs.getBoundingClientRect().left +
    tabs.scrollLeft +
    Number.parseFloat(paddingLeft) -
    overhang;
  const width =
    rect.width -
    Number.parseFloat(paddingLeft) -
    Number.parseFloat(paddingRight) +
    2 * overhang;
  tabs.style.setProperty('--underline-left', `${left}px`);
  tabs.style.setProperty('--underline-width', `${width}px`);
  const dot = active.querySelector(':scope > [data-dot]');
  if (dot) {
    const color = getComputedStyle(dot).backgroundColor;
    tabs.style.setProperty('--underline-color', color);
  } else {
    tabs.style.removeProperty('--underline-color');
  }
  tabs.dataset.measured = '';
}

export function HeaderTab({
  href,
  active,
  dotClassName,
  children,
}: {
  href: string;
  active: boolean;
  /** Adds a dot before the label. Its color also colors the underline. */
  dotClassName?: string;
  children: string;
}) {
  return (
    <EinLink
      unstyled
      className={styles.tab}
      href={href}
      aria-current={active ? 'page' : undefined}
    >
      {dotClassName && (
        <span className={dotClassName} data-dot aria-hidden="true" />
      )}
      <span className={styles.label} data-label={children}>
        {children}
      </span>
    </EinLink>
  );
}
