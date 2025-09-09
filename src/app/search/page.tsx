import { getSearchResults } from '~/actions/api/search';
import { getEnhetInfo } from '~/actions/api/enhet';
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
  const enhetsObjektInfo = await getEnhetInfo(enhet, urlSearchParams);
  return <SearchResultContainer
    searchResults={searchResults}
    enhetsObjektInfo={enhetsObjektInfo}

  />;
}
