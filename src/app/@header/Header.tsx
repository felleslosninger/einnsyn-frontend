'use client';

import { useParams } from 'next/navigation';
import { EinLink } from '~/components/EinLink/EinLink';
import { EinTransition } from '~/components/EinTransition/EinTransition';
import Logo from '~/components/Logo';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import cn from '~/lib/utils/className';
import styles from './Header.module.scss';
import SettingsMenu from './SettingsMenu';
import UserMenu from './UserMenu';

export default function Header({ children }: { children: React.ReactNode }) {
  const params = useParams<{ [key: string]: string | string[] }>();
  const rootPath = params.catchAll?.[0] ?? 'home';
  const { loadingPathname } = useNavigation();

  // TODO: Map rootPath from language specific URL pathname to generic pathname

  return (
    <EinTransition dependencies={[rootPath]} loading={!!loadingPathname}>
      <header className={cn(styles.header, `section-${rootPath}`)}>
        <div className="container-wrapper">
          <div className={cn(styles.pre, 'container-pre', 'collapsible')}>
            <EinLink className={cn(styles.logoLink, 'logo-link')} href="/">
              <Logo />
            </EinLink>
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
    </EinTransition>
  );
}
