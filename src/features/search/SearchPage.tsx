import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getName } from '~/lib/enhet/enhet';
import { findCachedEnhet, isUnknownEnhet } from '~/lib/enhet/enhet.server';
import { getSettings } from '~/lib/settings/settings.server';
import { getTranslateFunction } from '~/lib/translation/translation';
import {
  searchQueryToTokens,
  tokensToSearchQuery,
} from '~/lib/utils/searchStringTokenizer';
import SearchResultContainer from './SearchResultContainer';
import { getSearchResults } from './search.server';

type SearchPageProps = {
  params: Promise<{ enhet?: string }>;
  searchParams: Promise<{ [key: string]: string }>;
};

/** "<query> – <enhet>", or "Søk" in place of an enhet. */
export async function generateSearchMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const [{ enhet }, { language }] = await Promise.all([params, getSettings()]);
  const t = getTranslateFunction(language);
  const found = enhet ? await findCachedEnhet(enhet) : undefined;
  const scope = found ? getName(found, language) : t('search.header');

  // Only the words searched for: filters have their own controls
  const q = new URLSearchParams(await searchParams).get('q') ?? '';
  const query = tokensToSearchQuery(
    searchQueryToTokens(q).filter((token) => !token.prefix && token.value),
  );

  return { title: query ? `${query} – ${scope}` : scope };
}

export async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { enhet = '' } = await params;
  if (enhet && (await isUnknownEnhet(enhet))) {
    notFound();
  }

  const urlSearchParams = new URLSearchParams(await searchParams);
  const searchResults = await getSearchResults(enhet, urlSearchParams);
  return <SearchResultContainer searchResults={searchResults} />;
}
