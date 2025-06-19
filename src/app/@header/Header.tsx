import Logo from '~/components/Logo';
import cn from '~/lib/utils/className';

import styles from './Header.module.scss';
import SettingsMenu from './SettingsMenu';
import UserMenu from './UserMenu';

export default function Header({ children }: { children: React.ReactNode }) {
  return (
    <header className={styles.header}>
      <div className="container-wrapper">
        <div className={cn(styles.pre, 'container-pre', 'collapsible')}>
          <a className={cn(styles.logoLink, 'logo-link')} href="/">
            <Logo />
          </a>
        </div>
        <div className="container">{children}</div>
        <div className="container-post">
          <div className={styles.headerDropdownList}>
            <SettingsMenu />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
