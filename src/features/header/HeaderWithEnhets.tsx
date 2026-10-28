import Header from '~/features/header/Header';
import { getInitialEnhets } from '~/lib/enhet/enhet.server';

/**
 * The header, with the enhet store its search field needs already seeded.
 *
 * A request can be scoped to enhets by its path (`/oslo`) or by the `enhet`
 * search param; either has to be resolved server-side so the selector paints
 * names rather than ids. Nothing selected means no preload at all — see
 * `getInitialEnhets`.
 */
export default async function HeaderWithEnhets({
  enhetIdentifiers,
  children,
}: {
  enhetIdentifiers: string[];
  children: React.ReactNode;
}) {
  const enhets = await getInitialEnhets({ enhetIdentifiers });

  return <Header initialEnhets={enhets}>{children}</Header>;
}
