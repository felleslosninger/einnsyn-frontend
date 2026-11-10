/**
 * How the page moves when the section on screen changes. Set as
 * `data-page-transition`; the stylesheet gives each name its motion.
 */
export type PageTransitionName = 'inward' | 'outward' | 'fade';

// A section, a group of them, or any section.
type SectionMatch = string | ReadonlySet<string> | '*';

// The pages opened from search results.
const ARCHIVE_SECTIONS: ReadonlySet<string> = new Set([
  'saksmappe',
  'moetemappe',
]);

// The landing page carries the search field with an empty query.
const RESULTS_SECTIONS: ReadonlySet<string> = new Set([
  '',
  'search',
  '[enhet]',
]);

const STATIC_SECTIONS: ReadonlySet<string> = new Set(['about', 'privacy']);

// First match wins. `null`, or no match, means no page transition: the pages
// are left to animate the move themselves.
const PAGE_TRANSITIONS: readonly [
  from: SectionMatch,
  to: SectionMatch,
  transition: PageTransitionName | null,
][] = [
  // Between two entity pages there is no direction to show.
  [ARCHIVE_SECTIONS, ARCHIVE_SECTIONS, 'fade'],
  // From search results to archive pages (and back)
  [RESULTS_SECTIONS, ARCHIVE_SECTIONS, 'inward'],
  [ARCHIVE_SECTIONS, RESULTS_SECTIONS, 'outward'],
  // The results list animates a new search itself.
  [RESULTS_SECTIONS, RESULTS_SECTIONS, null],
  [STATIC_SECTIONS, '*', 'fade'],
  ['*', STATIC_SECTIONS, 'fade'],
];

function matchesSection(match: SectionMatch, section: string): boolean {
  if (match === '*') return true;
  return typeof match === 'string' ? match === section : match.has(section);
}

/**
 * The transition for a move between two sections, as `usePageSection` names
 * them, or `null` for none. A move within one section (a new query, another
 * saksmappe) never gets one.
 */
export function pageTransition(
  from: string,
  to: string,
): PageTransitionName | null {
  if (from === to) return null;
  const rule = PAGE_TRANSITIONS.find(
    ([fromMatch, toMatch]) =>
      matchesSection(fromMatch, from) && matchesSection(toMatch, to),
  );
  return rule?.[2] ?? null;
}
