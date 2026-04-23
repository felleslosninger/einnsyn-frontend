import { getInitialEnhetsForRequest } from '~/actions/api/enhetActions';
import { getSettings } from '~/actions/cookies/settingsCookie';
import { SearchHeader } from '~/features/search';

export default async function EnhetHeader({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ enhet?: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}>) {
  const [p, sp, settings] = await Promise.all([
    params,
    searchParams,
    getSettings(),
  ]);
  const initialEnhets = await getInitialEnhetsForRequest({
    pathEnhet: p.enhet,
    searchParamsEnhet: firstString(sp.enhet),
    languageCode: settings.language,
  });
  return <SearchHeader initialEnhets={initialEnhets} />;
}

function firstString(value: string | string[] | undefined) {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}
