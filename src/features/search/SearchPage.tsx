import { notFound } from 'next/navigation';
import { isUnknownEnhet } from '~/lib/enhet/enhet.server';
import SearchResultContainer from './SearchResultContainer';
import { getSearchResults } from './search.actions';

export async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ enhet?: string }>;
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const { enhet = '' } = await params;
  if (enhet && (await isUnknownEnhet(enhet))) {
    notFound();
  }

  const urlSearchParams = new URLSearchParams(await searchParams);
  const searchResults = await getSearchResults(enhet, urlSearchParams);
  return <SearchResultContainer searchResults={searchResults} />;
}
