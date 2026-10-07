import type { LanguageCode } from '~/lib/translation/translation';

export type Settings = {
  language: LanguageCode;
  stayLoggedIn: boolean;
  colorScheme: 'auto' | 'light' | 'dark';
};

export const SETTINGS_COOKIE_NAME = 'settings';
