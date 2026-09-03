import { getInitialEnhetsForRequest } from '~/actions/api/enhet.actions';
import { getSettings } from '~/actions/cookies/settingsCookie';
import { Header } from '~/features/header';
import {
  getRequestPathname,
  getRequestSearchParams,
} from '~/lib/routes/requestPath';
import { getPathEnhet } from '~/lib/routes/sections';

export default async function HeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pathname, searchParams, settings] = await Promise.all([
    getRequestPathname(),
    getRequestSearchParams(),
    getSettings(),
  ]);

  const initialEnhets = await getInitialEnhetsForRequest({
    pathEnhet: getPathEnhet(pathname),
    searchParamsEnhet: searchParams.get('enhet') ?? undefined,
    languageCode: settings.language,
  });

  return <Header initialEnhets={initialEnhets}>{children}</Header>;
}
