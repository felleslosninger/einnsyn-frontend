import { getSearchResults } from "~/features/search/searchActions";
import CalendarContainer from "~/features/moetekalender/CalendarContainer";

export default async function Moetekalender({
    params,
    searchParams,
}: {
    params: Promise<{ enhet: string }>;
    searchParams: Promise<{ [key: string]: string }>;
}) {
    const { enhet = '' } = await params;
    const urlSearchParams = new URLSearchParams(await searchParams);
    const searchResults = await getSearchResults(enhet, urlSearchParams);

    return <CalendarContainer searchResults={searchResults} />;
}