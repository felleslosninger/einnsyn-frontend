import { getSearchResults } from '~/actions/api/search';
import { getEnhetInfo } from '~/actions/api/enhet';
import { getEnhetStats } from '~/actions/api/statistics';
import { getEnhetIds } from '~/lib/utils/getEnhetIds';
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
  const enhetIds = await getEnhetIds(enhet, urlSearchParams);
  const searchResults = await getSearchResults(enhet, urlSearchParams);
  const enhetsObjektInfo = await getEnhetInfo(enhetIds);
  const enhetStats = await getEnhetStats(enhetIds);
  return <SearchResultContainer
    searchResults={searchResults}
    enhetsObjektInfo={enhetsObjektInfo}
    enhetStats={enhetStats}
  />;
}
