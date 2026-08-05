import { headers } from 'next/headers';
import { cache } from 'react';
import {
  type LanguageCode,
  resolveLanguageCode,
  supportedLanguages,
} from './translation';

/**
 * The language the request asks for, from `Accept-Language`.
 *
 * Constrained to {@link supportedLanguages}: without that list
 * `resolveLanguageCode` returns whatever the header names, and an unknown code
 * has no translation bundle, so every lookup would fall back to printing the
 * raw key. Falls back to bokmål when the header names nothing we have.
 */
export const getLanguageCode = cache(async (): Promise<LanguageCode> => {
  const myHeaders = await headers();

  const acceptLanguageHeader = myHeaders.get('Accept-Language') || '';
  const language =
    resolveLanguageCode(acceptLanguageHeader, supportedLanguages) ?? 'nb';

  return language;
});
