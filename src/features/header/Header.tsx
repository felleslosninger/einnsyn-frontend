import StickyHeader from '~/features/header/StickyHeader';
import { getInitialEnhets } from '~/lib/enhet/enhet.server';

/**
 * The header, with the enhet store its search field needs already seeded.
 *
 * A request can be scoped to enhets by its path (`/oslo`) or by the `enhet`
 * search param; either has to be resolved server-side so the selector paints
 * names rather than ids. Nothing selected means no preload at all — see
 * `getInitialEnhets`.
 */
export default async function Header({
  enhetIdentifiers,
  children,
}: {
  enhetIdentifiers: string[];
  children: React.ReactNode;
}) {
  const { enhets, version } = await getInitialEnhets({ enhetIdentifiers });

  return (
    <StickyHeader initialEnhets={enhets} enhetListVersion={version}>
      {children}
    </StickyHeader>
  );
}
