// Relative imports: next.config.ts loads this module, without the `~` alias.
import type { LanguageCode } from '../translation/translation';
import { ROUTES, type Translations } from './routes';

/** A route by its folder path, such as `/[enhet]/saksmappe/[saksmappe]`. */
export type Route = '/' | keyof typeof ROUTES;

// The values of a route's dynamic segments, in order.
type Values<R extends string> = R extends `${string}[${string}]${infer Rest}`
  ? [string, ...Values<Rest>]
  : [];

// `ROUTES`, indexable by any path.
const TRANSLATIONS: Readonly<Record<string, Translations>> = ROUTES;

type Children = { bySpelling: Map<string, string>; dynamic?: string };

const CHILDREN = indexChildren();

// Below each route ('' for the root): its static children by every normalized
// spelling, and its dynamic child.
function indexChildren(): Map<string, Children> {
  const index = new Map<string, Children>();
  for (const [route, translations] of Object.entries(TRANSLATIONS)) {
    const [parent, name] = splitLast(route);
    const children: Children = index.get(parent) ?? { bySpelling: new Map() };
    index.set(parent, children);
    if (isDynamic(name)) {
      children.dynamic = name;
      continue;
    }
    for (const spelling of [name, ...Object.values(translations)]) {
      const key = normalizeSegment(spelling);
      const existing = children.bySpelling.get(key);
      if (existing !== undefined && existing !== name) {
        throw new Error(`"${spelling}" spells both ${existing} and ${name}`);
      }
      children.bySpelling.set(key, name);
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
  return walk(pathname).folders;
}

/**
 * The values of `route`'s dynamic segments, in order, if `pathname`, spelled
 * in any language, is that route or below it; `undefined` if not. Every path
 * is below `/`, so home is checked with `matchesExactPath`.
 */
export function matchesPath<R extends Exclude<Route, '/'>>(
  pathname: string,
  route: R,
): Values<R> | undefined {
  return match(pathname, route, false) as Values<R> | undefined;
}

/** {@link matchesPath} for `route` itself, not the paths below it. */
export function matchesExactPath<R extends Route>(
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
  const { folders, values, isComplete } = walk(pathname);
  const routeFolders = pathSegments(route);
  if (
    routeFolders.some((folder, index) => folder !== folders[index]) ||
    (exact && (folders.length > routeFolders.length || !isComplete))
  ) {
    return undefined;
  }
  return values.slice(0, routeFolders.filter(isDynamic).length);
}

// The folders `pathname`'s segments lead through, and the decoded values of the
// dynamic ones, up to the first segment that matches none.
function walk(pathname: string) {
  const segments = pathSegments(pathname);
  const folders: string[] = [];
  const values: string[] = [];
  let route = '';
  for (const segment of segments) {
    const children = CHILDREN.get(route);
    // As in Next, a static segment wins over a dynamic one.
    const folder =
      children?.bySpelling.get(normalizeSegment(segment)) ?? children?.dynamic;
    if (folder === undefined) {
      break;
    }
    if (isDynamic(folder)) {
      values.push(decodeSegment(segment));
    }
    folders.push(folder);
    route += `/${folder}`;
  }
  return { folders, values, isComplete: folders.length === segments.length };
}

/** The href for `route`, its values filled in, spelled in the language. */
export function toLocalizedPath<R extends Route>(
  languageCode: LanguageCode,
  route: R,
  ...values: Values<R>
): string {
  const filled: readonly string[] = values;
  let valueIndex = 0;
  let path = '';
  const segments = pathSegments(route).map((name) => {
    path += `/${name}`;
    return isDynamic(name)
      ? filled[valueIndex++]
      : (TRANSLATIONS[path]?.[languageCode] ?? name);
  });
  return `/${segments.map(encodeURIComponent).join('/')}`;
}

/**
 * The enhet a URL is scoped to by its path (`/oslo`, `/oslo/sak/…`),
 * lowercased, or `undefined` when the root segment is not an enhet.
 */
export function getPathEnhet(pathname: string): string | undefined {
  return matchesPath(pathname, '/[enhet]')?.[0].toLowerCase();
}

type Rewrite = { source: string; destination: string };

/**
 * Rewrites from every translated spelling to the route folder, for
 * next.config.ts. Without them a translated path falls through to `[enhet]`.
 * Applied in order, each to the last one's result: a route's rewrites match
 * the path its parent's rewrites wrote.
 */
export function routeRewrites(): Rewrite[] {
  return Object.entries(TRANSLATIONS).flatMap(([route, translations]) => {
    // Next spells a dynamic segment `:name`.
    const [parent, name] = splitLast(route.replace(/\[(\w+)\]/g, ':$1'));
    const translated = Object.values(translations)
      .filter((spelling) => spelling !== name)
      // Browsers send non-ASCII segments percent-encoded: `ášši` as `%C3%A1…`.
      .flatMap((spelling) => [spelling, encodeURIComponent(spelling)]);
    return [...new Set(translated)].flatMap((spelling) =>
      ['', '/:rest*'].map((tail) => ({
        source: `${parent}/${spelling}${tail}`,
        destination: `${parent}/${name}${tail}`,
      })),
    );
  });
}

// `/login/register` → `['/login', 'register']`.
function splitLast(path: string): [string, string] {
  const index = path.lastIndexOf('/');
  return [path.slice(0, index), path.slice(index + 1)];
}

function isDynamic(name: string): boolean {
  return name.startsWith('[');
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
