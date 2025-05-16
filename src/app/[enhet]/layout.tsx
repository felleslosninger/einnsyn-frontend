import { getSearchResults } from '~/actions/api/search';
import SearchResultContainer from '~/layouts/search/SearchResultContainer';

export default async function Search({
	params,
	searchParams,
}: {
	params: Promise<{ enhet: string }>;
	searchParams: Promise<{ [key: string]: string }>;
}) {
	const { enhet = '' } = await params;
	const urlSearchParams = new URLSearchParams(await searchParams);
	const searchResults = await getSearchResults('', urlSearchParams);
	return <SearchResultContainer searchResults={searchResults} />;
}
