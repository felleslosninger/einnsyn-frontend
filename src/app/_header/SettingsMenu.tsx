'use client';

import { CogIcon } from '@navikt/aksel-icons';
import { cloneElement, useState } from 'react';
import EinPopup from '~/components/EinPopup/EinPopup';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { useTranslation } from '~/hooks/useTranslation';

import type { Settings } from '~/actions/cookies/settingsCookie';
import { EinButton } from '~/components/EinButton/EinButton';
import styles from './SettingsMenu.module.scss';

export default function SettingsButton() {
  const { settings } = useSessionData();

  return (
    <Dropdown button={<SettingsMenuButton />}>
      <SettingsMenuContent settings={settings} />
    </Dropdown>
  );
}

type DropdownButtonProps = {
  onClick?: () => void;
};

type DropdownContentProps = {
  settings: Settings;
};

export function SettingsMenuButton({ onClick }: DropdownButtonProps) {
  const t = useTranslation();

  return (
    <EinButton
      onClick={onClick}
      variant="tertiary"
      data-color="neutral"
      className={styles['settings-button']}
    >
      <CogIcon title={t('site.settings')} fontSize="1.5rem" />
    </EinButton>
  );
}

export function SettingsMenuContent({ settings }: DropdownContentProps) {
  const t = useTranslation();
  return (
    <div className={styles['settings-menu-content']}>
      <div className={styles['settings-menu-content-section']}>
        <strong>Settings</strong>
      </div>
      <div className={styles['settings-menu-content-section']}>
        {t('site.language')}: {settings.language}
        <br />
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
