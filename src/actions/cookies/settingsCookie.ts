'use server';

import type { LanguageCode } from '~/lib/translation/translation';
import {
  type CookieSettings,
  getCookie,
  updateCookieAction,
} from './cookieActions';

const SETTINGS_COOKIE_NAME = 'settings';

export type Settings = {
  language: LanguageCode;
  stayLoggedIn: boolean;
  colorScheme: 'auto' | 'light' | 'dark';
};

const defaultSettings: Settings = {
  language: 'nb',
  stayLoggedIn: false,
  colorScheme: 'auto',
};

/**
 * Wrapper for updating the settings cookie, specifying the cookie name and a high default maxAge.
 *
 * @param authContent
 * @returns
 */
export const updateSettingsAction = async (
  settingsContent: Partial<Settings>,
  cookieSettings: Partial<CookieSettings> = {},
) => {
  return updateCookieAction(SETTINGS_COOKIE_NAME, settingsContent, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365, // 365 days
    ...cookieSettings,
  });
};

export const getSettings = async () => {
  const settingsCookieContent = await getCookie<Settings>(SETTINGS_COOKIE_NAME);
  return {
    ...defaultSettings,
    ...settingsCookieContent,
  };
};
