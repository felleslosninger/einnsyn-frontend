import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getName } from '~/lib/enhet/enhet';
import { type FlattenedEnhet, getEnhets } from '~/lib/enhet/enhet.server';
import { getSettings } from '~/lib/settings/settings.server';
import { getTranslateFunction } from '~/lib/translation/translation';
import { logger } from '~/lib/utils/logger';
import SearchResultContainer from './SearchResultContainer';
import { getSearchParameters, getSearchResults } from './search.server';

type SearchPageProps = {
  params: Promise<{ enhet?: string }>;
  searchParams: Promise<{ [key: string]: string }>;
};

// One API lookup per request, shared by the metadata and the page, which both
// 404 when it's null: the page for the status, the metadata for the title.
// Undefined when the API couldn't say, so the search runs anyway.
const findPathEnhet = cache(
  async (identifier: string): Promise<FlattenedEnhet | null | undefined> => {
    try {
      return (await getEnhets([identifier]))[0] ?? null;
    } catch (error) {
      logger.error('Failed to look up the enhet in the path', error);
      return undefined;
    }
  },
);

/** "<query> – <enhet>", or "Søk" in place of an enhet. */
export async function generateSearchMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const [{ enhet }, { language }] = await Promise.all([params, getSettings()]);
  const t = getTranslateFunction(language);
  const found = enhet ? await findPathEnhet(enhet) : undefined;
  if (found === null) {
    notFound();
  }
  const scope = found ? getName(found, language) : t('search.header');

  // Only the words searched for: filters have their own controls
  const { query } = getSearchParameters(
    enhet,
    new URLSearchParams(await searchParams),
  );

  return { title: query ? `${query} – ${scope}` : scope };
}

export async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { enhet = '' } = await params;
  if (enhet && (await findPathEnhet(enhet)) === null) {
    notFound();
  }

  const urlSearchParams = new URLSearchParams(await searchParams);
  const searchResults = await getSearchResults(enhet, urlSearchParams);
  return <SearchResultContainer searchResults={searchResults} />;
}
