import { Header } from '~/features/header';
import {
  getRequestPathname,
  getRequestSearchParams,
} from '~/lib/routes/requestPath';
import { getPathEnhet } from '~/lib/routes/sections';

// A layout receives neither params nor searchParams, so the enhet the request
// is scoped to is recovered from the request URL instead.
export default async function HeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pathname, searchParams] = await Promise.all([
    getRequestPathname(),
    getRequestSearchParams(),
  ]);

  return (
    <Header
      pathEnhet={getPathEnhet(pathname)}
      searchParamsEnhet={searchParams.get('enhet') ?? undefined}
    >
      {children}
    </Header>
  );
}
