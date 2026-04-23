import { getInitialEnhetsForRequest } from '~/actions/api/enhetActions';
import { getSettings } from '~/actions/cookies/settingsCookie';
import { SearchHeader } from '~/features/search';
import { firstString } from '~/lib/utils/stringutils';

export default async function EnhetHeader({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ catchAll?: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}>) {
  const [p, sp, settings] = await Promise.all([
    params,
    searchParams,
    getSettings(),
  ]);
  const initialEnhets = await getInitialEnhetsForRequest({
    pathEnhet: getPathEnhetFromCatchAll(p.catchAll),
    searchParamsEnhet: firstString(sp.enhet),
    languageCode: settings.language,
  });
  return <SearchHeader initialEnhets={initialEnhets} />;
}

const STATIC_ROOT_SEGMENTS = new Set([
  'admin',
  'cart',
  'login',
  'moetekalender',
  'om',
  'personvern',
  'search',
]);

function getPathEnhetFromCatchAll(catchAll: string[] | undefined) {
  const firstSegment = catchAll?.[0];
  if (!firstSegment || STATIC_ROOT_SEGMENTS.has(firstSegment)) {
    return undefined;
  }
  return firstSegment;
}
