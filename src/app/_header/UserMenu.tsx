'use client';

import type { AuthInfo } from '@digdir/einnsyn-sdk';
import { Buildings3Icon, PersonIcon } from '@navikt/aksel-icons';
import { cloneElement, useState } from 'react';
import EinPopup from '~/components/EinPopup/EinPopup';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { useTranslation } from '~/hooks/useTranslation';
import LoginButton from './LoginButton';

import { EinButton } from '~/components/EinButton/EinButton';
import LogoutButton from './LogoutButton';
import styles from './UserMenu.module.scss';

export default function ProfileButton() {
  const { authInfo } = useSessionData();

  // User profile
  if (authInfo?.type === 'Bruker') {
    return (
      <Dropdown button={<BrukerMenuButton authInfo={authInfo} />}>
        <BrukerMenuContent authInfo={authInfo} />
      </Dropdown>
    );
  }

  // Employee profile
  if (authInfo?.type === 'Enhet') {
    return (
      <Dropdown button={<EnhetMenuButton authInfo={authInfo} />}>
        <EnhetMenuContent authInfo={authInfo} />
      </Dropdown>
    );
  }

  // Not logged in, show login button
  return <LoginButton />;
}

type DropdownButtonProps = {
  authInfo: AuthInfo;
  onClick?: () => void;
};

type DropdownContentProps = {
  authInfo: AuthInfo;
};

export function BrukerMenuButton({ authInfo, onClick }: DropdownButtonProps) {
  const t = useTranslation();
  const { email } = authInfo;

  return (
    <EinButton
      onClick={onClick}
      variant="tertiary"
      data-color="neutral"
      className={styles['profile-button']}
    >
      <PersonIcon title={t('site.loggedInAs', email)} fontSize="1.5rem" />
    </EinButton>
  );
}

export function BrukerMenuContent({ authInfo }: DropdownContentProps) {
  const t = useTranslation();
  return (
    <div>
      <p>{t('site.loggedInAs', authInfo.email)}</p>
      <LogoutButton />
    </div>
  );
}

export function EnhetMenuButton({ authInfo, onClick }: DropdownButtonProps) {
  const t = useTranslation();
  const orgnummer = authInfo.orgnummer;
  return (
    <EinButton
      onClick={onClick}
      variant="secondary"
      data-color="neutral"
      className={styles['profile-button']}
    >
      <Buildings3Icon
        title={t('site.loggedInAs', orgnummer)}
        fontSize="1.5rem"
      />
    </EinButton>
  );
}

export function EnhetMenuContent({ authInfo }: DropdownContentProps) {
  const t = useTranslation();
  return (
    <div className={styles['user-menu-content']}>
      <div className={styles['user-menu-content-section']}>
        <span data-size="sm">{t('site.loggedInAs')}</span>
        <br />
        <strong>{authInfo.orgnummer}</strong>
      </div>
      <div className={styles['user-menu-content-section']}>
        This organization is not registered in eInnsyn.
      </div>
      <div className={styles['user-menu-content-section']}>
        <LogoutButton />
      </div>
    </div>
  );
}

export function Dropdown({
  button,
  children,
}: {
  button: React.ReactElement<DropdownButtonProps>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const toggleDropdown = () => setOpen(!open);

  const buttonWithClickHandler = cloneElement(button, {
    onClick: toggleDropdown,
  });

  return (
    <div className={styles['user-menu']}>
      {buttonWithClickHandler}
      <EinPopup open={open} setOpen={setOpen}>
        {children}
      </EinPopup>
    </div>
  );
}
