// Relative imports: next.config.ts loads this module, without the `~` alias.
import type { LanguageCode } from '../translation/translation';
import { ROUTES, type RouteNode } from './routes';

type EnhetFolder = keyof (typeof ROUTES)['[enhet]']['children'];
type Mappe = keyof typeof MAPPE_FIELDS;

export type RootPage = Exclude<keyof typeof ROUTES, `[${string}]`>;
export type LoginStep = keyof (typeof ROUTES)['login']['children'];
export type EnhetPage = Exclude<EnhetFolder, Mappe>;

// Pages are named; entity routes are told apart by which identifiers they carry.
export type Route =
  | Exclusive<{ page: 'home' | RootPage }>
  | Exclusive<{ page: 'login'; step?: LoginStep }>
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
  | 'step'
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
} as const satisfies Partial<
  Record<EnhetFolder, readonly [RouteKey, RouteKey]>
>;

type RouteFolder = {
  name: string;
  node: RouteNode;
  children: RouteFolder[];
  // Static children by every normalized spelling, their names included.
  bySpelling: Map<string, RouteFolder>;
  dynamic?: RouteFolder;
};

function compile(name: string, node: RouteNode): RouteFolder {
  const folder: RouteFolder = {
    name,
    node,
    children: [],
    bySpelling: new Map(),
  };
  for (const [childName, childNode] of Object.entries(node.children ?? {})) {
    const child = compile(childName, childNode);
    folder.children.push(child);
    if (childName.startsWith('[')) {
      folder.dynamic = child;
      continue;
    }
    for (const spelling of spellings(child).map(normalizeSegment)) {
      const existing = folder.bySpelling.get(spelling);
      if (existing !== undefined && existing !== child) {
        throw new Error(
          `"${spelling}" spells both ${existing.name} and ${childName}`,
        );
      }
      folder.bySpelling.set(spelling, child);
    }
  }
  return folder;
}

/** The folder name plus every translation of it, deduplicated. */
function spellings({ name, node }: RouteFolder): string[] {
  const translations = Object.values(node).filter(
    (value) => typeof value === 'string',
  );
  return [...new Set([name, ...translations])];
}

const ROOT = compile('', { children: ROUTES });

/**
 * The route a pathname points at, in any language. `undefined` for a path
 * below an enhet that matches no route.
 */
export function parsePathname(pathname: string): Route | undefined {
  const segments = pathSegments(pathname);
  const path = walk(segments);
  const [first, second, mappe, child] = path;
  if (first === undefined) {
    return { page: 'home' };
  }

  // A root page owns whatever follows it.
  if (first.name !== '[enhet]') {
    const page = first.name as RootPage;
    return page === 'login' && second !== undefined
      ? { page, step: second.name as LoginStep }
      : { page };
  }

  if (path.length < segments.length) {
    return undefined;
  }
  const enhetIdentifier = first.value.toLowerCase();
  if (second === undefined) {
    return { enhetIdentifier };
  }
  if (!(second.name in MAPPE_FIELDS)) {
    return { page: second.name as EnhetPage, enhetIdentifier };
  }
  if (mappe === undefined) {
    return undefined;
  }

  const [mappeField, childField] = MAPPE_FIELDS[second.name as Mappe];
  return {
    enhetIdentifier,
    [mappeField]: mappe.value,
    ...(child !== undefined && { [childField]: child.value }),
  } as Route;
}

// The folders a pathname's segments lead through, each with its segment
// decoded, up to the first segment that matches none.
function walk(segments: string[]): { name: string; value: string }[] {
  const path: { name: string; value: string }[] = [];
  let folder = ROOT;
  for (const segment of segments) {
    const next =
      folder.bySpelling.get(normalizeSegment(segment)) ?? folder.dynamic;
    if (next === undefined) {
      break;
    }
    path.push({ name: next.name, value: decodeSegment(segment) });
    folder = next;
  }
  return path;
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
  return ROOT.bySpelling.has(segment) ? undefined : segment;
}

/** The href for a route, with fixed segments in the given language. */
export function buildPathname(
  route: Route,
  languageCode: LanguageCode,
): string {
  const segments: string[] = [];
  let folder = ROOT;
  // Into a static child, spelled in the language.
  const enter = (name: string) => {
    folder = folder.bySpelling.get(name) as RouteFolder;
    segments.push(folder.node[languageCode] ?? name);
  };
  // Into the dynamic child, spelled as the value.
  const fill = (value: string) => {
    folder = folder.dynamic as RouteFolder;
    segments.push(value);
  };

  if (route.enhetIdentifier !== undefined) {
    fill(route.enhetIdentifier);
  }
  if (route.page !== undefined && route.page !== 'home') {
    enter(route.page);
  }
  if (route.step !== undefined) {
    enter(route.step);
  }
  for (const [mappe, [mappeField, childField]] of Object.entries(
    MAPPE_FIELDS,
  )) {
    const mappeIdentifier = route[mappeField];
    if (mappeIdentifier === undefined) {
      continue;
    }
    enter(mappe);
    fill(mappeIdentifier);
    const childIdentifier = route[childField];
    if (childIdentifier !== undefined) {
      fill(childIdentifier);
    }
  }

  return `/${segments.map(encodeURIComponent).join('/')}`;
}

type Rewrite = { source: string; destination: string };

/**
 * Rewrites from every translated spelling to the route folder, for
 * next.config.ts. Without them a translated path falls through to `[enhet]`.
 * Applied in order, each to the last one's result: a folder's rewrites match
 * the path its parent's rewrites wrote.
 */
export function routeRewrites(): Rewrite[] {
  // `prefix` is the parent's path in folder names, dynamic ones as parameters.
  const rewrites = (folder: RouteFolder, prefix: string): Rewrite[] =>
    folder.children.flatMap((child) => {
      const segment =
        child === folder.dynamic ? `:${child.name.slice(1, -1)}` : child.name;
      const translated = spellings(child)
        .filter((spelling) => spelling !== child.name)
        // Browsers send non-ASCII segments percent-encoded: `ášši` as `%C3%A1…`.
        .flatMap((spelling) => [spelling, encodeURIComponent(spelling)]);
      return [
        ...[...new Set(translated)].flatMap((spelling) =>
          ['', '/:rest*'].map((tail) => ({
            source: `${prefix}/${spelling}${tail}`,
            destination: `${prefix}/${segment}${tail}`,
          })),
        ),
        ...rewrites(child, `${prefix}/${segment}`),
      ];
    });

  return rewrites(ROOT, '');
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
