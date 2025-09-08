import { getSearchResults, getEnhetsObjektInfo } from '~/actions/api/search';
import SearchResultContainer from '~/app/search/SearchResultContainer';

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
  const enhetsObjektInfo = await getEnhetsObjektInfo(enhet, urlSearchParams);
  return <SearchResultContainer
    searchResults={searchResults}
    enhetsObjektInfo={enhetsObjektInfo}

  />;
}
