import { useSessionData } from '~/components/SessionDataProvider/SessionDataProvider';
import type { LanguageCode } from '~/lib/translation/translation';

/**
 *
 * @param defaultLanguageCode If language hasn't been initialized, use this language
 * @returns Current language code and a function to change it
 */
export function useLanguageCode(): LanguageCode {
  const { settings } = useSessionData();
  return settings.language ?? 'en';
}
