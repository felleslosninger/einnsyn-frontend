'use server';

import { headers } from 'next/headers';
import { cache } from 'react';
import {
  type LanguageCode,
  resolveLanguageCode,
  supportedLanguages,
} from '~/lib/translation/translation';
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

const staticDefaults = {
  stayLoggedIn: false,
  colorScheme: 'auto',
} satisfies Omit<Settings, 'language'>;

/**
 * The language the request asks for, from `Accept-Language`.
 *
 * Constrained to {@link supportedLanguages}: without that list
 * `resolveLanguageCode` returns whatever the header names, and an unknown code
 * has no translation bundle, so every lookup would fall back to printing the
 * raw key. Falls back to bokmål when the header names nothing we have.
 */
const resolveDefaultLanguage = cache(async (): Promise<LanguageCode> => {
  const acceptLanguage = (await headers()).get('Accept-Language') || '';
  return resolveLanguageCode(acceptLanguage, supportedLanguages) ?? 'nb';
});

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
  const settingsCookieContent =
    await getCookie<Partial<Settings>>(SETTINGS_COOKIE_NAME);
  return {
    ...staticDefaults,
    ...settingsCookieContent,
    // A visitor who has never chosen a language gets the one their browser
    // asks for, rather than everyone defaulting to bokmål. An explicit choice
    // is stored in the cookie and always wins.
    language:
      settingsCookieContent?.language ?? (await resolveDefaultLanguage()),
  };
};
