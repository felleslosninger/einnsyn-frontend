import { getTranslateFunction } from '~/lib/translation/translation';
import { useLanguageCode } from './useLanguageCode';

/**
 *
 * @returns A function to translate a key
 */
export function useTranslation() {
  const languageCode = useLanguageCode();
  return getTranslateFunction(languageCode);
}
