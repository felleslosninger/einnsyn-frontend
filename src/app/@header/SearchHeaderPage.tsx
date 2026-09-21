import { SearchHeader } from '~/features/search';
import { getInitialEnhets } from '~/lib/enhet/enhet.server';
import { readEnhetIdentifiers } from '~/lib/utils/searchHref';

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
  const enhetIdentifiers = readEnhetIdentifiers({
    pathEnhet,
    enhetParam: sp.enhet,
  });
  const { enhets, version } = await getInitialEnhets({ enhetIdentifiers });

  return <SearchHeader initialEnhets={enhets} enhetListVersion={version} />;
}
