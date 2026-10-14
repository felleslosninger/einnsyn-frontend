import 'server-only';

import { getSettings } from '~/lib/settings/settings.server';
import { getTranslateFunction } from './translation';

/**
 * Translator for server components, in the language `getSettings` resolves.
 * Client components use `useTranslation` instead.
 */
export const getTranslator = async () => {
  const { language } = await getSettings();
  return getTranslateFunction(language);
};
