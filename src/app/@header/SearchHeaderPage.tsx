import { getSettings } from '~/actions/cookies/settingsCookie';
import { SearchHeader } from '~/features/search';
import { getInitialEnhets } from '~/lib/enhet/enhet.server';

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
  // `sp.enhet` is a bare string for one `?enhet=` and an array for several.
  const enhetIdentifiers = [pathEnhet ?? [], sp.enhet ?? []].flat();
  const { enhets, version } = await getInitialEnhets({
    enhetIdentifiers,
    languageCode: settings.language,
  });

  return <SearchHeader initialEnhets={enhets} enhetListVersion={version} />;
}
