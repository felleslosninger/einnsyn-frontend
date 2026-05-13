import { getInitialEnhetsForRequest } from '~/actions/api/enhetActions';
import { getSettings } from '~/actions/cookies/settingsCookie';
import { SearchHeader } from '~/features/search';
import { firstString } from '~/lib/utils/stringutils';

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
    searchParamsEnhet: firstString(sp.enhet),
    languageCode: settings.language,
  });

  return <SearchHeader initialEnhets={initialEnhets} />;
}
