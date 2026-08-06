import SearchResultContainer from './SearchResultContainer';
import { getSearchResults } from './searchActions';

export async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ enhet?: string }>;
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const { enhet = '' } = await params;
  const urlSearchParams = new URLSearchParams(await searchParams);
  const searchResults = await getSearchResults(enhet, urlSearchParams);
  return <SearchResultContainer searchResults={searchResults} />;
}
