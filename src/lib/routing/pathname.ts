// Relative imports: next.config.ts loads this module, without the `~` alias.
import en from '../../resources/translations/en/translations.json';
import nb from '../../resources/translations/nb/translations.json';
import nn from '../../resources/translations/nn/translations.json';
import se from '../../resources/translations/se/translations.json';
import type { LanguageCode } from '../translation/translation';

/**
 * Every URL shape the app has:
 *
 *   /                                       home
 *   /<root page>[/…]                        `routing.root`: search, about, …
 *   /:enhet                                 enhet
 *   /:enhet/<enhet page>[/…]                `routing.enhet`
 *   /:enhet/<mappe>/:mappe[/:child]         `routing.mappe`: saksmappe, moetemappe
 *
 * Each `routing` key is a route folder, its value the folder's spelling in that
 * language. Every spelling is accepted, so no URL favours a language;
 * `buildPathname` writes the viewer's.
 */
export type RootPage = keyof typeof nb.routing.root;
export type EnhetPage = keyof typeof nb.routing.enhet;
type Mappe = keyof typeof nb.routing.mappe;

// Pages are named; entity routes are told apart by which identifiers they carry.
export type Route =
  | Exclusive<{ page: 'home' | RootPage }>
  | Exclusive<{ page: EnhetPage; enhetIdentifier: string }>
  | Exclusive<{ enhetIdentifier: string }>
  | Exclusive<{
      enhetIdentifier: string;
      saksmappeIdentifier: string;
      journalpostIdentifier?: string;
    }>
  | Exclusive<{
      enhetIdentifier: string;
      moetemappeIdentifier: string;
      moetesakIdentifier?: string;
    }>;

type RouteKey =
  | 'page'
  | 'enhetIdentifier'
  | 'saksmappeIdentifier'
  | 'journalpostIdentifier'
  | 'moetemappeIdentifier'
  | 'moetesakIdentifier';

// Forbids every other route's keys, which a plain union would let through.
type Exclusive<T> = T & { [K in Exclude<RouteKey, keyof T>]?: never };

// The identifier fields of each mappe and of its child.
const MAPPE_FIELDS = {
  saksmappe: ['saksmappeIdentifier', 'journalpostIdentifier'],
  moetemappe: ['moetemappeIdentifier', 'moetesakIdentifier'],
} as const satisfies Record<Mappe, readonly [RouteKey, RouteKey]>;

type Level = keyof typeof nb.routing;
type Words = Partial<Record<string, string>>;

const ROUTING: Record<LanguageCode, Record<Level, Words>> = {
  nb: nb.routing,
  nn: nn.routing,
  en: en.routing,
  se: se.routing,
};

/** The route folder name plus every translation of it, deduplicated. */
function spellings(level: Level, folder: string): string[] {
  return [
    ...new Set([
      folder,
      ...Object.values(ROUTING).flatMap(
        (routing) => routing[level][folder] ?? [],
      ),
    ]),
  ];
}

type Folder = { level: Level; folder: string };

// Normalized spelling → folder, over levels that share a path position.
function foldersBySpelling(...levels: Level[]): Map<string, Folder> {
  const map = new Map<string, Folder>();
  for (const level of levels) {
    for (const folder of Object.keys(nb.routing[level])) {
      for (const spelling of spellings(level, folder).map(normalizeSegment)) {
        const existing = map.get(spelling);
        if (existing !== undefined && existing.folder !== folder) {
          throw new Error(
            `"${spelling}" spells both ${existing.folder} and ${folder}`,
          );
        }
        map.set(spelling, { level, folder });
      }
    }
  }
  return map;
}

const ROOT_FOLDERS = foldersBySpelling('root');
const ENHET_FOLDERS = foldersBySpelling('enhet', 'mappe');

/**
 * The route a pathname points at, in any language. `undefined` for a path
 * below an enhet that matches no route.
 */
export function parsePathname(pathname: string): Route | undefined {
  const [first, second, mappeId, childId, ...rest] = pathSegments(pathname);
  if (first === undefined) {
    return { page: 'home' };
  }

  const root = ROOT_FOLDERS.get(normalizeSegment(first));
  if (root !== undefined) {
    return { page: root.folder as RootPage };
  }

  const enhetIdentifier = normalizeSegment(first);
  if (second === undefined) {
    return { enhetIdentifier };
  }

  const match = ENHET_FOLDERS.get(normalizeSegment(second));
  if (match?.level === 'enhet') {
    return { page: match.folder as EnhetPage, enhetIdentifier };
  }
  if (match === undefined || mappeId === undefined || rest.length > 0) {
    return undefined;
  }

  const [mappeField, childField] = MAPPE_FIELDS[match.folder as Mappe];
  return {
    enhetIdentifier,
    [mappeField]: decodeSegment(mappeId),
    ...(childId !== undefined && { [childField]: decodeSegment(childId) }),
  } as Route;
}

/**
 * The enhet a URL is scoped to by its path (`/oslo`, `/oslo/sak/…`), or
 * `undefined` when the root segment is not an enhet.
 */
export function getPathEnhet(pathname: string): string | undefined {
  const [first] = pathSegments(pathname);
  if (first === undefined) {
    return undefined;
  }

  const segment = normalizeSegment(first);
  return ROOT_FOLDERS.has(segment) ? undefined : segment;
}

/** The href for a route, with fixed segments in the given language. */
export function buildPathname(
  route: Route,
  languageCode: LanguageCode,
): string {
  const routing = ROUTING[languageCode];
  const segments: string[] = [];

  if (route.enhetIdentifier !== undefined) {
    segments.push(route.enhetIdentifier);
  }

  if (route.page !== undefined && route.page !== 'home') {
    const level = route.enhetIdentifier === undefined ? 'root' : 'enhet';
    segments.push(routing[level][route.page] ?? route.page);
  }

  for (const [mappe, [mappeField, childField]] of Object.entries(
    MAPPE_FIELDS,
  )) {
    const mappeIdentifier = route[mappeField];
    if (mappeIdentifier === undefined) {
      continue;
    }
    segments.push(routing.mappe[mappe] ?? mappe, mappeIdentifier);
    const childIdentifier = route[childField];
    if (childIdentifier !== undefined) {
      segments.push(childIdentifier);
    }
  }

  return `/${segments.map(encodeURIComponent).join('/')}`;
}

/**
 * Rewrites from every translated spelling to the route folder, for
 * next.config.ts. Without them a translated path falls through to `[enhet]`.
 */
export function routeRewrites(): { source: string; destination: string }[] {
  const rewrites = (level: Level, prefix: string, tails: string[]) =>
    Object.keys(nb.routing[level]).flatMap((folder) =>
      spellings(level, folder)
        .filter((spelling) => spelling !== folder)
        // Browsers send non-ASCII segments percent-encoded: `ášši` as `%C3%A1…`.
        .flatMap((spelling) => [spelling, encodeURIComponent(spelling)])
        .filter((spelling, index, all) => all.indexOf(spelling) === index)
        .flatMap((spelling) =>
          tails.map((tail) => ({
            source: `${prefix}/${spelling}${tail}`,
            destination: `${prefix}/${folder}${tail}`,
          })),
        ),
    );

  return [
    ...rewrites('root', '', ['', '/:rest*']),
    ...rewrites('enhet', '/:enhet', ['', '/:rest*']),
    ...rewrites('mappe', '/:enhet', ['/:mappe', '/:mappe/:child']),
  ];
}

/** Path segments, with any query/hash tail stripped. */
function pathSegments(pathname: string): string[] {
  return pathname.split(/[?#]/)[0].split('/').filter(Boolean);
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

// Segments arrive percent-encoded (`/%C3%A1%C5%A1%C5%A1i` vs `/ášši`), so both
// sides are decoded and case-folded before comparing.
function normalizeSegment(segment: string): string {
  return decodeSegment(segment).toLowerCase();
}
