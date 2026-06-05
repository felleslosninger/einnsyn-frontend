'use server';

import { headers } from 'next/headers';
import {
  type LanguageCode,
  resolveLanguageCode,
  supportedLanguages,
} from '~/lib/translation/translation';
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

const staticDefaults = {
  stayLoggedIn: false,
  colorScheme: 'auto',
} satisfies Omit<Settings, 'language'>;

const resolveDefaultLanguage = async (): Promise<LanguageCode> => {
  const acceptLanguage = (await headers()).get('Accept-Language') || '';
  return resolveLanguageCode(acceptLanguage, supportedLanguages) ?? 'nb';
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
  const settingsCookieContent = await getCookie<Partial<Settings>>(
    SETTINGS_COOKIE_NAME,
  );
  return {
    ...staticDefaults,
    ...settingsCookieContent,
    language:
      settingsCookieContent?.language ?? (await resolveDefaultLanguage()),
  };
};
