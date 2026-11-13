'use client';

import { Buildings3Icon, PersonIcon } from '@navikt/aksel-icons';
import { cloneElement, type Ref, useRef, useState } from 'react';
import { EinButton } from '~/components/EinButton/EinButton';
import { EinLink } from '~/components/EinLink/EinLink';
import EinPopup from '~/components/EinPopup/EinPopup';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { brukerRoutes } from '~/features/bruker/brukerRoutes';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import type { ExtendedAuthInfo } from '~/lib/auth/auth';
import { toLocalizedPath } from '~/lib/routing/pathname';
import cn from '~/lib/utils/className';
import { isStandardClick } from '~/lib/utils/isStandardClick';
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
  ref?: Ref<HTMLButtonElement>;
};

type DropdownContentProps = {
  authInfo: ExtendedAuthInfo;
};

export function BrukerMenuButton({
  authInfo,
  onClick,
  'aria-expanded': ariaExpanded,
  ref,
}: DropdownButtonProps) {
  const t = useTranslation();
  const { email } = authInfo;

  return (
    <EinButton
      ref={ref}
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
  const languageCode = useLanguageCode();
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
        {brukerRoutes.map(({ route, translationKey }) => (
          <EinButton
            key={route}
            asChild
            variant="tertiary"
            data-color="neutral"
            fullWidth
          >
            <EinLink unstyled href={toLocalizedPath(languageCode, route)}>
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
  ref,
}: DropdownButtonProps) {
  const t = useTranslation();
  const orgnummer = authInfo.orgnummer;
  return (
    <EinButton
      ref={ref}
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const toggleDropdown = () => setOpen(!open);

  const buttonWithClickHandler = cloneElement(button, {
    ref: buttonRef,
    onClick: toggleDropdown,
    'aria-expanded': open,
  });

  const closeOnItemClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      isStandardClick(e) &&
      target.closest('.ein-popup') &&
      target.closest('a[href]')
    ) {
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
        anchorRef={buttonRef}
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
