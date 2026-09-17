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
  const sp = await searchParams;
  // `sp.enhet` is a bare string for one `?enhet=` and an array for several.
  const enhetIdentifiers = [pathEnhet ?? [], sp.enhet ?? []].flat();
  const { enhets, version } = await getInitialEnhets({ enhetIdentifiers });

  return <SearchHeader initialEnhets={enhets} enhetListVersion={version} />;
}
