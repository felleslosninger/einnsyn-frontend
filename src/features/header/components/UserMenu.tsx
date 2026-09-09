'use client';

import { Buildings3Icon, PersonIcon } from '@navikt/aksel-icons';
import { cloneElement, useState } from 'react';
import type { ExtendedAuthInfo } from '~/actions/authentication/auth';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinLink } from '~/components/EinLink/EinLink';
import EinPopup from '~/components/EinPopup/EinPopup';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { brukerRoutes } from '~/features/bruker/brukerRoutes';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';
import styles from './UserMenu.module.scss';

export default function ProfileButton() {
  const { authInfo } = useSessionData();
  const t = useTranslation();

  // User profile
  if (authInfo?.type === 'Bruker') {
    return (
      <Dropdown
        button={<BrukerMenuButton authInfo={authInfo} />}
        label={t('site.loggedInAs', authInfo.email)}
      >
        <BrukerMenuContent authInfo={authInfo} />
      </Dropdown>
    );
  }

  // Employee profile
  if (authInfo?.type === 'Enhet') {
    return (
      <Dropdown
        button={<EnhetMenuButton authInfo={authInfo} />}
        label={t('site.loggedInAs', authInfo.orgnummer)}
      >
        <EnhetMenuContent authInfo={authInfo} />
      </Dropdown>
    );
  }

  // Not logged in, show login button
  return <LoginButton />;
}

type DropdownButtonProps = {
  authInfo: ExtendedAuthInfo;
  onClick?: () => void;
  'aria-expanded'?: boolean;
};

type DropdownContentProps = {
  authInfo: ExtendedAuthInfo;
};

export function BrukerMenuButton({
  authInfo,
  onClick,
  'aria-expanded': ariaExpanded,
}: DropdownButtonProps) {
  const t = useTranslation();
  const { email } = authInfo;

  return (
    <EinButton
      onClick={onClick}
      aria-expanded={ariaExpanded}
      variant="tertiary"
      data-color="neutral"
      aria-label={t('site.loggedInAs', email)}
      className={styles['profile-button']}
    >
      <PersonIcon fontSize="1.5rem" aria-hidden="true" />
    </EinButton>
  );
}

export function BrukerMenuContent({ authInfo }: DropdownContentProps) {
  const t = useTranslation();
  return (
    <div className="header-dropdown-content">
      <div className="header-dropdown-content-section">
        <span data-size="sm">{t('site.loggedInAs')}</span>
        <br />
        <strong>{authInfo.email}</strong>
      </div>

      <div
        className={cn(
          styles['bruker-dropdown-content-section-links'],
          'header-dropdown-content-section',
        )}
      >
        {brukerRoutes.map(({ href, translationKey }) => (
          <EinButton
            key={href}
            asChild
            variant="tertiary"
            data-color="neutral"
            fullWidth
          >
            <EinLink unstyled href={href}>
              {t(translationKey)}
            </EinLink>
          </EinButton>
        ))}
      </div>
      <div className="header-dropdown-content-section">
        <LogoutButton />
      </div>
    </div>
  );
}

export function EnhetMenuButton({
  authInfo,
  onClick,
  'aria-expanded': ariaExpanded,
}: DropdownButtonProps) {
  const t = useTranslation();
  const orgnummer = authInfo.orgnummer;
  return (
    <EinButton
      onClick={onClick}
      aria-expanded={ariaExpanded}
      variant="secondary"
      data-color="neutral"
      aria-label={t('site.loggedInAs', orgnummer)}
      className={cn(styles['enhet-dropdown-button'], 'header-button')}
    >
      <Buildings3Icon fontSize="1.5rem" aria-hidden="true" />
    </EinButton>
  );
}

export function EnhetMenuContent({ authInfo }: DropdownContentProps) {
  const t = useTranslation();
  return (
    <div
      className={cn(
        styles['enhet-dropdown-content'],
        'header-dropdown-content',
      )}
    >
      <div
        className={cn(
          styles['enhet-dropdown-content-section'],
          'header-dropdown-content-section',
        )}
      >
        <span data-size="sm">{t('site.loggedInAsLabel')}</span>
        <br />
        <strong>{authInfo.enhet?.navn ?? authInfo.orgnummer}</strong>
      </div>
      <div
        className={cn(
          styles['enhet-dropdown-content-section'],
          'header-dropdown-content-section',
        )}
      >
        {authInfo.enhet && (
          <div>
            <EinLink href={`/admin/${authInfo.orgnummer}/api-keys`}>
              {t('admin.apiKey.labelPlural')}
            </EinLink>
          </div>
        )}
        {!authInfo.enhet && 'This organization is not registered in eInnsyn.'}
      </div>
      <div
        className={cn(
          styles['enhet-dropdown-content-section'],
          'header-dropdown-content-section',
        )}
      >
        <LogoutButton />
      </div>
    </div>
  );
}

export function Dropdown({
  button,
  children,
  label,
}: {
  button: React.ReactElement<DropdownButtonProps>;
  children: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const toggleDropdown = () => setOpen(!open);

  const buttonWithClickHandler = cloneElement(button, {
    onClick: toggleDropdown,
    'aria-expanded': open,
  });

  const closeOnItemClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.ein-popup') && target.closest('a, button')) {
      setOpen(false);
    }
  };

  return (
    <div
      className={cn(styles.dropdown, 'header-dropdown')}
      onClickCapture={closeOnItemClick}
    >
      {buttonWithClickHandler}
      <EinPopup
        open={open}
        setOpen={setOpen}
        autoFocus
        restoreFocus
        contentProps={{ role: 'group', 'aria-label': label }}
      >
        {children}
      </EinPopup>
    </div>
  );
}
