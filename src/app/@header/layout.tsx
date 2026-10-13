import { HeaderWithEnhets } from '~/features/header';
import { getPathEnhet } from '~/lib/routing/pathname';
import {
  getRequestPathname,
  getRequestSearchParams,
} from '~/lib/routing/requestPath.server';
import { getEnhetSelection } from '~/lib/routing/searchParams';

// A layout receives neither params nor searchParams, so the enhet the request
// is scoped to is recovered from the request URL.
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
    <HeaderWithEnhets
      enhetIdentifiers={getEnhetSelection(getPathEnhet(pathname), searchParams)}
    >
      {children}
    </HeaderWithEnhets>
  );
}
