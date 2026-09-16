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
  const enhetIdentifiers = [
    pathEnhet,
    ...(typeof sp.enhet === 'string' ? [sp.enhet] : (sp.enhet ?? [])),
  ].filter((e) => e !== undefined);
  const { enhets, version } = await getInitialEnhets({
    enhetIdentifiers,
    languageCode: settings.language,
  });

  return <SearchHeader initialEnhets={enhets} enhetListVersion={version} />;
}
