'use server';

import type { LanguageCode } from '~/lib/translation/translation';
import { getLanguageCode } from '~/lib/translation/translation.actions';
import {
  type CookieSettings,
  getCookie,
  updateCookieAction,
} from './cookie.actions';

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

export const getSettings = async (): Promise<Settings> => {
  const settingsCookieContent = await getCookie<Settings>(SETTINGS_COOKIE_NAME);
  return {
    ...defaultSettings,
    ...settingsCookieContent,
    // A visitor who has never chosen a language gets the one their browser
    // asks for, rather than everyone defaulting to bokmål. An explicit choice
    // is stored in the cookie and always wins.
    language: settingsCookieContent?.language ?? (await getLanguageCode()),
  };
};
