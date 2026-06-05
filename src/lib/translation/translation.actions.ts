'use server';

import { getSettings } from '~/actions/cookies/settingsCookie';
import { getTranslateFunction, type LanguageCode } from './translation';

export const getLanguageCode = async (): Promise<LanguageCode> => {
  const { language } = await getSettings();
  return language;
};

export const getTranslator = async () => {
  const languageCode = await getLanguageCode();
  return getTranslateFunction(languageCode);
};
