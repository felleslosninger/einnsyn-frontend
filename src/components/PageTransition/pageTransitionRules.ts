import { SECTIONS_WITH_RESULTS, type Section } from '~/lib/routing/sections';

/**
 * How the page moves when the section on screen changes. Set as
 * `data-page-transition`; the stylesheet gives each name its motion.
 */
export type PageTransitionName = 'inward' | 'outward' | 'fade';

// A section, a group of them, or any section.
type SectionMatch = Section | ReadonlySet<Section> | '*';

// The pages opened from search results.
const ARCHIVE_SECTIONS: ReadonlySet<Section> = new Set([
  'saksmappe',
  'moetemappe',
]);

const STATIC_SECTIONS: ReadonlySet<Section> = new Set(['about', 'privacy']);

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
  [SECTIONS_WITH_RESULTS, ARCHIVE_SECTIONS, 'inward'],
  [ARCHIVE_SECTIONS, SECTIONS_WITH_RESULTS, 'outward'],
  // The results list animates a new search itself.
  [SECTIONS_WITH_RESULTS, SECTIONS_WITH_RESULTS, null],
  [STATIC_SECTIONS, '*', 'fade'],
  ['*', STATIC_SECTIONS, 'fade'],
];

function matchesSection(match: SectionMatch, section: Section): boolean {
  if (match === '*') return true;
  return typeof match === 'string' ? match === section : match.has(section);
}

/**
 * The transition for a move between two sections, or `null` for none. A move
 * within one section (a new query, another saksmappe) never gets one.
 */
export function pageTransition(
  from: Section,
  to: Section,
): PageTransitionName | null {
  if (from === to) return null;
  const rule = PAGE_TRANSITIONS.find(
    ([fromMatch, toMatch]) =>
      matchesSection(fromMatch, from) && matchesSection(toMatch, to),
  );
  return rule?.[2] ?? null;
}
