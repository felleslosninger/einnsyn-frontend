import { EinLink } from '~/components/EinLink/EinLink';
import styles from './HeaderTabs.module.scss';

export function HeaderTabs({ children }: { children: React.ReactNode }) {
  return <div className={styles.tabs}>{children}</div>;
}

export function HeaderTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <EinLink
      unstyled
      className={styles.tab}
      href={href}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </EinLink>
  );
}
