import { notFound } from 'next/navigation';
import { isUnknownEnhet } from '~/lib/enhet/enhet.server';
import SearchResultContainer from './SearchResultContainer';
import { getSearchResults } from './search.server';

export async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ enhet?: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { enhet = '' } = await params;
  if (enhet && (await isUnknownEnhet(enhet))) {
    notFound();
  }

  // A repeated parameter (e.g. `?entity=a&entity=b`) arrives as an array, which
  // URLSearchParams would join into one comma-separated value.
  const urlSearchParams = new URLSearchParams(
    Object.entries(await searchParams).flatMap(([key, value]) =>
      [value ?? []].flat().map((v) => [key, v]),
    ),
  );
  const searchResults = await getSearchResults(enhet, urlSearchParams);
  return <SearchResultContainer searchResults={searchResults} />;
}
