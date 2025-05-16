import { cache } from 'react';
import { resolveLanguageCode, type LanguageCode } from './translation';
import { headers } from 'next/headers';

export const getLanguageCode = cache(async (): Promise<LanguageCode> => {
	const myHeaders = await headers();

	const acceptLanguageHeader = myHeaders.get('Accept-Language') || '';
	const language = resolveLanguageCode(acceptLanguageHeader) ?? 'nb';

	return language;
});
