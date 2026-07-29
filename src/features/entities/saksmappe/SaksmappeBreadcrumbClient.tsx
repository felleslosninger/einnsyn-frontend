'use client';

import EinBreadcrumb, {
  type BreadcrumbItem,
} from '~/components/EinBreadcrumb/Breadcrumbs';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { useHeaderCollapsed } from '~/features/header/useHeaderMode';
import { useTranslation } from '~/hooks/useTranslation';
import { prefersReducedMotion } from '~/lib/utils/prefersReducedMotion';

/**
 * Renders the saksmappe breadcrumb and swaps its trailing crumb with the header
 * collapse: "Sak {saksnummer}" (plain, current page) at the top, the case title
 * as a link back to the case root once collapsed. EinBreadcrumb animates the
 * label change typewriter-style; clicking the link scrolls to the top (which
 * re-expands the header).
 */
export default function SaksmappeBreadcrumbClient({
  ancestors,
  saksLabel,
  title,
  href,
}: {
  ancestors: BreadcrumbItem[];
  saksLabel: string;
  title: string;
  href: string;
}) {
  const collapsed = useHeaderCollapsed();
  const t = useTranslation();
  const { pathname } = useNavigation();

  // Mirror JournalpostList: build the case-root href from the saksmappe
  // identifier exactly as it appears in the current URL. The entity-derived
  // `href` is slug-first, but search links to cases by id — so on an id-based URL
  // following this crumb would change the `[saksmappe]` route param, remounting
  // the whole case subtree and cancelling the very transition this crumb is part
  // of. Falls back to the server-provided href if the segment isn't there.
  const segment = pathname.split('/')[2];
  const caseHref = segment ? `/${t('routing.saksmappePath')}/${segment}` : href;

  const current: BreadcrumbItem = collapsed
    ? {
        label: title,
        href: caseHref,
        ariaLabel: title,
        // Scroll to the top (re-expanding the header); EinLink still navigates
        // to the case root, which closes any open journalpost detail. `scroll:
        // false` so Next doesn't ALSO jump to the top and cancel this animation.
        scroll: false,
        onClick: () =>
          window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          }),
      }
    : { label: saksLabel };

  return <EinBreadcrumb items={[...ancestors, current]} animate />;
}
