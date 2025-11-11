import SearchResultContainer from '~/features/search/SearchResultContainer';
import { getSearchResults } from '~/features/search/searchActions';

export default async function Search({
  params,
  searchParams,
}: {
  params: Promise<{ enhet: string }>;
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const { enhet = '' } = await params;
  const urlSearchParams = new URLSearchParams(await searchParams);
  const searchResults = await getSearchResults(enhet, urlSearchParams);
  return <SearchResultContainer searchResults={searchResults} />;
}
