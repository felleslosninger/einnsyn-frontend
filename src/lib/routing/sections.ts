import { type EnhetPage, parsePathname, type RootPage } from './pathname';

/**
 * Which kind of page a pathname shows, as the UI tells them apart. Read off
 * the route, so it does not depend on the language the URL is spelled in.
 */
export type Section =
  | 'home'
  | RootPage
  | 'enhet'
  | EnhetPage
  | 'saksmappe'
  | 'moetemappe';

/**
 * The section a pathname belongs to. A path below an enhet that matches no
 * route still counts as the enhet's.
 */
export function getSection(pathname: string): Section {
  const route = parsePathname(pathname);
  if (route?.page !== undefined) {
    return route.page;
  }
  if (route?.saksmappeIdentifier !== undefined) {
    return 'saksmappe';
  }
  if (route?.moetemappeIdentifier !== undefined) {
    return 'moetemappe';
  }
  return 'enhet';
}

// Sections with a page in `@modal/(modal)`, which opens over the page beneath
// it. Only a hint before a navigation lands; the router tree decides after.
const MODAL_SECTIONS: ReadonlySet<Section> = new Set(['login']);

/** Whether this section opens as a modal over the page beneath it. */
export function isModalSection(section: Section): boolean {
  return MODAL_SECTIONS.has(section);
}
