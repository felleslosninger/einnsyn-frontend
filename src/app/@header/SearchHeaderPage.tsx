import { getInitialEnhetsForRequest } from '~/actions/api/enhet.actions';
import { SearchHeader } from '~/features/search';
import { getSettings } from '~/lib/settings/settings.server';

export type HeaderSearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export default async function SearchHeaderPage({
  pathEnhet,
  searchParams,
}: Readonly<{
  pathEnhet?: string;
  searchParams: HeaderSearchParams;
}>) {
  const [sp, settings] = await Promise.all([searchParams, getSettings()]);
  const initialEnhets = await getInitialEnhetsForRequest({
    pathEnhet,
    searchParamsEnhet: typeof sp.enhet === 'string' ? sp.enhet : sp.enhet?.[0],
    languageCode: settings.language,
  });

  return <SearchHeader initialEnhets={initialEnhets} />;
}
