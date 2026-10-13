import { SearchHeader } from '~/features/search';
import { getInitialEnhets } from '~/lib/enhet/enhet.server';
import { getEnhetSelection } from '~/lib/routing/searchParams';

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
  const enhetIdentifiers = getEnhetSelection(
    pathEnhet,
    new URLSearchParams([sp.enhet ?? []].flat().map((v) => ['enhet', v])),
  );
  const { enhets, version } = await getInitialEnhets({ enhetIdentifiers });

  return <SearchHeader initialEnhets={enhets} enhetListVersion={version} />;
}
