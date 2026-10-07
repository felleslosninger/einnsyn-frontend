import { getInitialEnhetsForRequest } from '~/actions/api/enhet.actions';
import { SearchHeader } from '~/features/search';
import { getEnhetSelection } from '~/lib/routing/searchParams';
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
    selected: getEnhetSelection(
      pathEnhet,
      new URLSearchParams([sp.enhet ?? []].flat().map((v) => ['enhet', v])),
    ),
    languageCode: settings.language,
  });

  return <SearchHeader initialEnhets={initialEnhets} />;
}
