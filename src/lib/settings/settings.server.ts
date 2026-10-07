import 'server-only';

import { headers } from 'next/headers';
import { cache } from 'react';
import {
  type CookieSettings,
  getCookie,
  updateCookie,
} from '~/lib/cookies/cookies.server';
import {
  type LanguageCode,
  resolveLanguageCode,
  supportedLanguages,
} from '~/lib/translation/translation';
import { SETTINGS_COOKIE_NAME, type Settings } from './settings';

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

/** Merges into the stored settings, rather than replacing them. */
export const updateSettings = async (
  settingsContent: Partial<Settings>,
  cookieSettings: Partial<CookieSettings> = {},
) => {
  return updateCookie(SETTINGS_COOKIE_NAME, settingsContent, {
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
      settingsCookieContent?.language &&
      supportedLanguages.includes(settingsCookieContent.language)
        ? settingsCookieContent.language
        : await resolveDefaultLanguage(),
  };
};
