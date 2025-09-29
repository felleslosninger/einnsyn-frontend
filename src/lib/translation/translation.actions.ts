import { headers } from 'next/headers';
import { cache } from 'react';
import { type LanguageCode, resolveLanguageCode } from './translation';

export const getLanguageCode = cache(async (): Promise<LanguageCode> => {
  const myHeaders = await headers();

  const acceptLanguageHeader = myHeaders.get('Accept-Language') || '';
  const language = resolveLanguageCode(acceptLanguageHeader) ?? 'nb';

  return language;
});
