import { Header } from '~/features/header';
import {
  getRequestPathname,
  getRequestSearchParams,
} from '~/lib/routes/requestPath';
import { getPathEnhet } from '~/lib/routes/sections';
import { readEnhetIdentifiers } from '~/lib/utils/searchHref';

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
    <Header
      enhetIdentifiers={readEnhetIdentifiers({
        pathEnhet: getPathEnhet(pathname),
        enhetParam: searchParams.getAll('enhet'),
      })}
    >
      {children}
    </Header>
  );
}
