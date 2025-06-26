'use client';

import { CogIcon, MonitorIcon, MoonIcon, SunIcon } from '@navikt/aksel-icons';
import { cloneElement, useState } from 'react';
import EinPopup from '~/components/EinPopup/EinPopup';
import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import { useTranslation } from '~/hooks/useTranslation';

import type { Settings } from '~/actions/cookies/settingsCookie';
import { EinButton } from '~/components/EinButton/EinButton';
import cn from '~/lib/utils/className';
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
      className={cn(styles.settingsDropdownButton, 'header-button')}
    >
      <CogIcon title={t('site.settings')} fontSize="1.5rem" />
    </EinButton>
  );
}

export function SettingsMenuContent({ settings }: DropdownContentProps) {
  const t = useTranslation();
  const { updateSettings } = useSessionData();

  return (
    <div
      className={cn(styles.settingsDropdownContent, 'header-dropdown-content')}
    >
      <div
        className={cn(
          styles.settingsDropdownContentSection,
          'header-dropdown-content-section',
        )}
      >
        <strong>{t('site.settings')}</strong>
      </div>
      <div
        className={cn(
          styles.settingsDropdownContentSection,
          'header-dropdown-content-section',
        )}
      >
        <div className={styles.languageContainer}>
          <form action={() => updateSettings({ language: 'nb' })}>
            <EinButton
              type="submit"
              variant="secondary"
              fullWidth
              data-language-selector="nb"
            >
              Bokmål
            </EinButton>
          </form>
          <form action={() => updateSettings({ language: 'nn' })}>
            <EinButton
              type="submit"
              variant="secondary"
              fullWidth
              data-language-selector="nn"
            >
              Nynorsk
            </EinButton>
          </form>
          <form action={() => updateSettings({ language: 'en' })}>
            <EinButton
              type="submit"
              variant="secondary"
              fullWidth
              data-language-selector="en"
            >
              English
            </EinButton>
          </form>
          <form action={() => updateSettings({ language: 'se' })}>
            <EinButton
              type="submit"
              variant="secondary"
              fullWidth
              data-language-selector="se"
            >
              Sámegiella
            </EinButton>
          </form>
        </div>
      </div>

      <div
        className={cn(
          styles.settingsDropdownContentSection,
          'header-dropdown-content-section',
        )}
      >
        <div className={styles.colorSchemeContainer}>
          <form action={() => updateSettings({ colorScheme: 'light' })}>
            <EinButton
              type="submit"
              variant="secondary"
              data-color-scheme-selector="light"
            >
              <SunIcon title={t('site.colorSchemeLight')} fontSize="1.5rem" />
            </EinButton>
          </form>
          <form action={() => updateSettings({ colorScheme: 'dark' })}>
            <EinButton
              type="submit"
              variant="secondary"
              data-color-scheme-selector="dark"
            >
              <MoonIcon title={t('site.colorSchemeDark')} fontSize="1.5rem" />
            </EinButton>
          </form>
          <form action={() => updateSettings({ colorScheme: 'auto' })}>
            <EinButton
              type="submit"
              variant="secondary"
              data-color-scheme-selector="auto"
            >
              <MonitorIcon
                title={t('site.colorSchemeSystem')}
                fontSize="1.5rem"
              />
            </EinButton>
          </form>
        </div>
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
    <div className={cn(styles['settings-dropdown'], 'header-dropdown')}>
      {buttonWithClickHandler}
      <EinPopup open={open} setOpen={setOpen}>
        {children}
      </EinPopup>
    </div>
  );
}
