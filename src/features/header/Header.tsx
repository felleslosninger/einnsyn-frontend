import { getInitialEnhetsForRequest } from '~/actions/api/enhet.actions';
import { getSettings } from '~/actions/cookies/settingsCookie';
import StickyHeader from '~/features/header/StickyHeader';

/**
 * The header, with the enhet cache its search field needs already seeded.
 *
 * A request can be scoped to an enhet by its path (`/oslo`) or by the `enhet`
 * search param; either has to be resolved server-side so the selector paints
 * names rather than ids. Nothing selected means no preload at all — see
 * `getInitialEnhetsForRequest`.
 */
export default async function Header({
  pathEnhet,
  searchParamsEnhet,
  children,
}: {
  pathEnhet?: string;
  searchParamsEnhet?: string;
  children: React.ReactNode;
}) {
  const { language } = await getSettings();
  const initialEnhets = await getInitialEnhetsForRequest({
    pathEnhet,
    searchParamsEnhet,
    languageCode: language,
  });

  return <StickyHeader initialEnhets={initialEnhets}>{children}</StickyHeader>;
}
