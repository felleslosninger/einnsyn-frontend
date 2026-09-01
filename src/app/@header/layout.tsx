import { headers } from 'next/headers';
import { getInitialEnhetsForRequest } from '~/actions/api/enhet.actions';
import { getSettings } from '~/actions/cookies/settingsCookie';
import { Header } from '~/features/header';
import { getPathEnhet } from '~/lib/routes/sections';

export default async function HeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [requestHeaders, settings] = await Promise.all([
    headers(),
    getSettings(),
  ]);

  const pathname = requestHeaders.get('x-pathname') ?? '';
  const searchParams = new URLSearchParams(
    requestHeaders.get('x-search') ?? '',
  );

  const initialEnhets = await getInitialEnhetsForRequest({
    pathEnhet: getPathEnhet(pathname),
    searchParamsEnhet: searchParams.get('enhet') ?? undefined,
    languageCode: settings.language,
  });

  return <Header initialEnhets={initialEnhets}>{children}</Header>;
}
