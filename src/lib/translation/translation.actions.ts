'use server';

import { getSettings } from '~/actions/cookies/settingsCookie';
import { getTranslateFunction, type LanguageCode } from './translation';

/**
 * The language to render in: the visitor's stored choice, or the one their
 * browser asked for when they have never chosen. Resolved by `getSettings`, so
 * this is the effective language rather than the raw `Accept-Language` value.
 */
export const getLanguageCode = async (): Promise<LanguageCode> => {
  const { language } = await getSettings();
  return language;
};

export const getTranslator = async () => {
  const languageCode = await getLanguageCode();
  return getTranslateFunction(languageCode);
};
