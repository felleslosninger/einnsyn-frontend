// Relative imports: next.config.ts loads this module, without the `~` alias.
import type { LanguageCode } from '../translation/translation';
import { ROUTES, type Translations } from './routes';

/** A route by its folder path, such as `/[enhet]/saksmappe/[saksmappe]`. */
export type Route = '/' | keyof typeof ROUTES;

// The values of a route's dynamic segments, in order.
type Values<R extends string> = R extends `${string}[${string}]${infer Rest}`
  ? [string, ...Values<Rest>]
  : [];

type Subfolders = { bySpelling: Map<string, string>; dynamic?: string };

// The folders directly below each route ('' for the root): the static ones by
// every normalized spelling, and the dynamic one.
const SUBFOLDERS = indexSubfolders();

function indexSubfolders(): Map<string, Subfolders> {
  const index = new Map<string, Subfolders>();
  for (const [route, translations] of Object.entries(ROUTES)) {
    const [parent, folder] = splitLast(route);
    const subfolders: Subfolders = index.get(parent) ?? {
      bySpelling: new Map(),
    };
    index.set(parent, subfolders);
    if (isDynamic(folder)) {
      subfolders.dynamic = folder;
      continue;
    }
    for (const spelling of [folder, ...Object.values(translations)]) {
      const key = normalizeSegment(spelling);
      const existing = subfolders.bySpelling.get(key);
      if (existing !== undefined && existing !== folder) {
        throw new Error(`"${spelling}" spells both ${existing} and ${folder}`);
      }
      subfolders.bySpelling.set(key, folder);
    }
  }
  return index;
}

/**
 * The folders of the deepest route in `ROUTES` that `pathname`, spelled in any
 * language, is at or below: `/oslo/sak/sm_1` gives `['[enhet]', 'saksmappe',
 * '[saksmappe]']`, and `/` gives `[]`.
 */
export function resolvePath(pathname: string): string[] {
  const folders: string[] = [];
  let route = '';
  for (const segment of pathSegments(pathname)) {
    const subfolders = SUBFOLDERS.get(route);
    // As in Next, a static segment wins over a dynamic one.
    const folder =
      subfolders?.bySpelling.get(normalizeSegment(segment)) ??
      subfolders?.dynamic;
    if (folder === undefined) {
      break;
    }
    folders.push(folder);
    route += `/${folder}`;
  }
  return folders;
}

/**
 * The values of `route`'s dynamic segments, in order, if `pathname`, spelled
 * in any language, is that route or below it; `undefined` if not. Every path
 * is below `/`, so home is checked with `matchExactPath`.
 */
export function matchPath<R extends Exclude<Route, '/'>>(
  pathname: string,
  route: R,
): Values<R> | undefined {
  return match(pathname, route, false) as Values<R> | undefined;
}

/** {@link matchPath} for `route` itself, not the paths below it. */
export function matchExactPath<R extends Route>(
  pathname: string,
  route: R,
): Values<R> | undefined {
  return match(pathname, route, true) as Values<R> | undefined;
}

function match(
  pathname: string,
  route: string,
  exact: boolean,
): string[] | undefined {
  const segments = pathSegments(pathname);
  const folders = resolvePath(pathname);
  const routeFolders = pathSegments(route);
  const isAtOrBelow = routeFolders.every(
    (folder, index) => folder === folders[index],
  );
  const isAt = isAtOrBelow && segments.length === routeFolders.length;
  if (exact ? !isAt : !isAtOrBelow) {
    return undefined;
  }
  // `resolvePath` gives one folder per segment, so their indices line up.
  return routeFolders.flatMap((folder, index) =>
    isDynamic(folder) ? [decodeSegment(segments[index])] : [],
  );
}

/** The href for `route`, its values filled in, spelled in the language. */
export function toLocalizedPath<R extends Route>(
  languageCode: LanguageCode,
  route: R,
  ...values: Values<R>
): string {
  // `ROUTES`, indexable by the path built below.
  const routes: Readonly<Record<string, Translations>> = ROUTES;
  let valueIndex = 0;
  let path = '';
  const segments = pathSegments(route).map((folder) => {
    path += `/${folder}`;
    return isDynamic(folder)
      ? values[valueIndex++]
      : (routes[path]?.[languageCode] ?? folder);
  });
  return `/${segments.map(encodeURIComponent).join('/')}`;
}

/**
 * `pathname`, spelled in any language, with its static segments in the
 * language, encoded like `toLocalizedPath`. Values, and the segments below the
 * deepest route it resolves to, keep their spelling and case.
 */
export function translatePathname(
  pathname: string,
  languageCode: LanguageCode,
): string {
  // `ROUTES`, indexable by the path built below.
  const routes: Readonly<Record<string, Translations>> = ROUTES;
  const segments = pathSegments(pathname).map(decodeSegment);
  let route = '';
  for (const [index, folder] of resolvePath(pathname).entries()) {
    route += `/${folder}`;
    if (!isDynamic(folder)) {
      segments[index] = routes[route]?.[languageCode] ?? folder;
    }
  }
  return `/${segments.map(encodeURIComponent).join('/')}`;
}

/**
 * The enhet a URL is scoped to by its path (`/oslo`, `/oslo/sak/…`),
 * lowercased, or `undefined` when the root segment is not an enhet.
 */
export function getPathEnhet(pathname: string): string | undefined {
  return matchPath(pathname, '/[enhet]')?.[0].toLowerCase();
}

type Rewrite = { source: string; destination: string };

/**
 * Rewrites from every translated spelling to the route folder, for
 * next.config.ts. Without them a translated path falls through to `[enhet]`.
 * Applied in order, each to the last one's result: a route's rewrites match
 * the path its parent's rewrites wrote.
 */
export function routeRewrites(): Rewrite[] {
  return Object.entries(ROUTES).flatMap(([route, translations]) => {
    // Next spells a dynamic segment `:name`.
    const [parent, folder] = splitLast(route.replace(/\[(\w+)\]/g, ':$1'));
    const translated = Object.values(translations)
      .filter((spelling) => spelling !== folder)
      // Browsers send non-ASCII segments percent-encoded: `ášši` as `%C3%A1…`.
      .flatMap((spelling) => [spelling, encodeURIComponent(spelling)]);
    // `:rest*` may be empty, so this covers the route and the paths below it.
    return [...new Set(translated)].map((spelling) => ({
      source: `${parent}/${spelling}/:rest*`,
      destination: `${parent}/${folder}/:rest*`,
    }));
  });
}

// `/login/register` → `['/login', 'register']`.
function splitLast(path: string): [string, string] {
  const index = path.lastIndexOf('/');
  return [path.slice(0, index), path.slice(index + 1)];
}

function isDynamic(folder: string): boolean {
  return folder.startsWith('[');
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
