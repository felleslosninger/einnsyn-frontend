import { getInitialEnhetsForRequest } from '~/actions/api/enhetActions';
import { getSettings } from '~/actions/cookies/settingsCookie';
import { SearchHeader } from '~/features/search';

export default async function EnhetHeader({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}>) {
  const [sp, settings] = await Promise.all([searchParams, getSettings()]);
  const initialEnhets = await getInitialEnhetsForRequest({
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
