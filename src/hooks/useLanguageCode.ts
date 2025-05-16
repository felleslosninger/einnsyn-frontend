import type { LanguageCode } from '~/lib/translation/translation';

/**
 *
 * @param defaultLanguageCode If language hasn't been initialized, use this language
 * @returns Current language code and a function to change it
 */
export function useLanguageCode(): LanguageCode {
	// const rootLoaderData = useRouteLoaderData<typeof loader>('root');
	// return rootLoaderData?.language ?? 'nb';
	return 'en';
}
