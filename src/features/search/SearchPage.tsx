import { notFound } from 'next/navigation';
import { isUnknownEnhet } from '~/lib/enhet/enhet.server';
import { getTranslator } from '~/lib/translation/translation.server';
import SearchResultContainer from './SearchResultContainer';
import { getSearchResults } from './search.server';

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
  if (!searchResults) {
    const t = await getTranslator();
    return (
      <div className="container-wrapper main-content" role="alert">
        <p>{t('common.searchFailed')}</p>
      </div>
    );
  }
  return <SearchResultContainer searchResults={searchResults} />;
}
