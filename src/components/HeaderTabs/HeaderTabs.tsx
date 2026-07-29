import type { ReactNode } from 'react';
import { EinLink } from '~/components/EinLink/EinLink';
import cn from '~/lib/utils/className';
import styles from './HeaderTabs.module.scss';

// The horizontal tab row that sits under the site header — the search section's
// entity tabs, and the saksmappe header's "Journalposter i saka" bar. Owns the
// shared container chrome (the global `.header-tabs` spacing + sizing data-attrs)
// so every instance stays visually identical. Tab items carry the global
// `.header-tab` class (use <HeaderTab> for links, or apply it directly for a
// non-link tab such as a heading). `actions` is the right-aligned slot — a filter
// dropdown, a sort / back-to-top control, etc.
export function HeaderTabs({
  children,
  actions,
  className,
}: {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(styles.tabsContainer, className, 'header-tabs')}
      data-size="sm"
      data-color="neutral"
    >
      <div className={styles.tabs}>{children}</div>
      {actions != null && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

// A single tab link. The visual treatment lives in the global `.header-tab`
// styles (shared with non-link tabs); this just wires the link + active state.
export function HeaderTab({
  href,
  active,
  className,
  children,
}: {
  href: string;
  active?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <EinLink
      className={cn('header-tab', className, { active: !!active })}
      href={href}
    >
      {children}
    </EinLink>
  );
}
