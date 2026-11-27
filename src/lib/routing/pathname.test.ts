import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { describe, it } from 'node:test';
import nextConfig from '../../../next.config';
import {
  type LanguageCode,
  supportedLanguages,
} from '../translation/translation';
import {
  getPathEnhet,
  matchExactPath,
  matchPath,
  type Route,
  resolvePath,
  routeRewrites,
  toLocalizedPath,
  translatePathname,
} from './pathname';
import { ROUTES } from './routes';

describe('ROUTES', () => {
  it('lists every route after its parent', () => {
    const listed = new Set(['']);
    for (const route of Object.keys(ROUTES)) {
      assert.ok(listed.has(route.slice(0, route.lastIndexOf('/'))), route);
      listed.add(route);
    }
  });

  it('lists every login route folder', async () => {
    const folders = (
      await readdir(new URL('../../app/login', import.meta.url), {
        withFileTypes: true,
      })
    )
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    assert.ok(folders.length > 0);
    for (const folder of folders) {
      assert.ok(`/login/${folder}` in ROUTES, folder);
    }
  });
});

describe('resolvePath', () => {
  it('reads a path in any language as its folders', () => {
    assert.deepEqual(resolvePath('/'), []);
    assert.deepEqual(resolvePath(''), []);
    assert.deepEqual(resolvePath('/s%C3%B8k'), ['search']);
    assert.deepEqual(resolvePath('/logg-inn/opprett-konto'), [
      'login',
      'register',
    ]);
    assert.deepEqual(resolvePath('/oslo/%C3%A1%C5%A1%C5%A1i/sm_1/jp_1'), [
      '[enhet]',
      'saksmappe',
      '[saksmappe]',
      '[journalpost]',
    ]);
  });

  it('stops at the first segment no route spells', () => {
    assert.deepEqual(resolvePath('/admin/abc/api-keys'), ['admin']);
    assert.deepEqual(resolvePath('/login/unknown'), ['login']);
    assert.deepEqual(resolvePath('/oslo/unknown/sm_1'), ['[enhet]']);
  });
});

describe('matchExactPath', () => {
  it('matches home', () => {
    assert.deepEqual(matchExactPath('/', '/'), []);
    assert.deepEqual(matchExactPath('', '/'), []);
    assert.equal(matchExactPath('/search', '/'), undefined);
  });

  it('matches a root page in any language, encoding or case', () => {
    for (const path of ['/search', '/søk', '/s%C3%B8k', '/SØK', '/oza']) {
      assert.deepEqual(matchExactPath(path, '/search'), [], path);
    }
  });

  it('matches a login step in any language, encoding or case', () => {
    for (const path of [
      '/login/register',
      '/logg-inn/opprett-konto',
      '/login/create-account',
    ]) {
      assert.deepEqual(matchExactPath(path, '/login/register'), [], path);
    }
    for (const path of [
      '/LOGIN/Forgotten-Password?x=1',
      '/logg-inn/glemt-passord',
      '/logg-inn/gl%C3%B8ymt-passord',
    ]) {
      assert.deepEqual(
        matchExactPath(path, '/login/forgotten-password'),
        [],
        path,
      );
    }
  });

  it('matches an enhet, decoded but not case-folded', () => {
    assert.deepEqual(matchExactPath('/oslo', '/[enhet]'), ['oslo']);
    assert.deepEqual(matchExactPath('/OSLO', '/[enhet]'), ['OSLO']);
    assert.deepEqual(matchExactPath('/tr%C3%B8ndelag', '/[enhet]'), [
      'trøndelag',
    ]);
    // A typo is indistinguishable from an enhet slug, by design.
    assert.deepEqual(matchExactPath('/serach', '/[enhet]'), ['serach']);
    // A malformed escape is kept as is.
    assert.deepEqual(matchExactPath('/100%', '/[enhet]'), ['100%']);
  });

  it('never reads a root page as an enhet', () => {
    assert.equal(matchExactPath('/search', '/[enhet]'), undefined);
    assert.equal(matchExactPath('/S%C3%B8K', '/[enhet]'), undefined);
  });

  it('is undefined for any other route, including the paths below it', () => {
    assert.equal(matchExactPath('/login/register', '/login'), undefined);
    assert.equal(matchExactPath('/login/unknown', '/login'), undefined);
    assert.equal(matchExactPath('/admin/abc/api-keys', '/admin'), undefined);
    assert.equal(
      matchExactPath('/oslo/sak', '/[enhet]/saksmappe/[saksmappe]'),
      undefined,
    );
    assert.equal(
      matchExactPath('/oslo/unknown/abc', '/[enhet]/saksmappe/[saksmappe]'),
      undefined,
    );
    assert.equal(
      matchExactPath('/oslo/sak/sm_1', '/[enhet]/moetemappe/[moetemappe]'),
      undefined,
    );
    assert.equal(
      matchExactPath(
        '/oslo/sak/sm_1/jp_1/extra',
        '/[enhet]/saksmappe/[saksmappe]/[journalpost]',
      ),
      undefined,
    );
  });
});

describe('matchPath', () => {
  it('matches a route and the paths below it', () => {
    assert.deepEqual(matchPath('/login', '/login'), []);
    assert.deepEqual(matchPath('/logg-inn/opprett-konto', '/login'), []);
    assert.deepEqual(matchPath('/login/unknown', '/login'), []);
    assert.deepEqual(matchPath('/admin/abc/api-keys', '/admin'), []);
  });

  it("takes values from the route's own segments only", () => {
    assert.deepEqual(matchPath('/oslo/sak/sm_1/jp_1', '/[enhet]'), ['oslo']);
    assert.deepEqual(
      matchPath('/oslo/sak/sm_1/jp_1', '/[enhet]/saksmappe/[saksmappe]'),
      ['oslo', 'sm_1'],
    );
  });

  it('is undefined above or beside the route', () => {
    assert.equal(matchPath('/login', '/login/register'), undefined);
    assert.equal(
      matchPath('/oslo', '/[enhet]/saksmappe/[saksmappe]'),
      undefined,
    );
    assert.equal(matchPath('/admin/abc', '/[enhet]'), undefined);
  });
});

describe('getPathEnhet', () => {
  it('returns the enhet of anything below it', () => {
    assert.equal(getPathEnhet('/oslo'), 'oslo');
    assert.equal(getPathEnhet('/OSLO'), 'oslo');
    assert.equal(getPathEnhet('/oslo/sak/sm_1'), 'oslo');
    assert.equal(getPathEnhet('/oslo/unknown'), 'oslo');
  });

  it('reserves every root route folder', async () => {
    const folders = (
      await readdir(new URL('../../app', import.meta.url), {
        withFileTypes: true,
      })
    )
      // Skip `[enhet]`, `@slots` and `(groups)`, which add no static segment.
      .filter((entry) => entry.isDirectory() && /^[a-z]/.test(entry.name))
      .map((entry) => entry.name);

    assert.ok(folders.length > 0);
    for (const folder of folders) {
      assert.equal(getPathEnhet(`/${folder}`), undefined, folder);
    }
  });
});

describe('toLocalizedPath', () => {
  it('writes fixed segments in the given language', () => {
    assert.equal(toLocalizedPath('nb', '/search'), '/s%C3%B8k');
    assert.equal(toLocalizedPath('en', '/search'), '/search');
    assert.equal(
      toLocalizedPath('nb', '/login/register'),
      '/logg-inn/opprett-konto',
    );
    assert.equal(
      toLocalizedPath('en', '/login/register'),
      '/login/create-account',
    );
    assert.equal(toLocalizedPath('se', '/login/register'), '/login/register');
    assert.equal(
      toLocalizedPath('en', '/[enhet]/saksmappe/[saksmappe]', 'oslo', 'sm_1'),
      '/oslo/case/sm_1',
    );
    assert.equal(
      toLocalizedPath(
        'nn',
        '/[enhet]/moetemappe/[moetemappe]/[moetesak]',
        'oslo',
        'mm_1',
        'ms_1',
      ),
      '/oslo/moete/mm_1/ms_1',
    );
  });

  it('encodes the values', () => {
    assert.equal(
      toLocalizedPath(
        'nb',
        '/[enhet]/saksmappe/[saksmappe]',
        'trøndelag',
        'a/b',
      ),
      '/tr%C3%B8ndelag/sak/a%2Fb',
    );
  });

  it('round-trips every route through matchExactPath in every language', () => {
    // The routes are mixed, so their values can't be typed per route.
    const localize = toLocalizedPath as (
      languageCode: LanguageCode,
      route: Route,
      ...values: string[]
    ) => string;
    for (const route of ['/', ...Object.keys(ROUTES)] as Route[]) {
      // Values that need encoding: a non-ASCII letter and a slash.
      const values = (route.match(/\[/g) ?? []).map((_, index) => `ø/${index}`);
      for (const languageCode of supportedLanguages) {
        const href = localize(languageCode, route, ...values);
        assert.deepEqual(
          matchExactPath(href, route),
          values,
          `${languageCode} ${href}`,
        );
      }
    }
  });
});

describe('translatePathname', () => {
  it('respells a root page from any language, encoding or case', () => {
    for (const path of ['/search', '/søk', '/s%C3%B8k', '/SØK', '/oza']) {
      assert.equal(translatePathname(path, 'nb'), '/s%C3%B8k', path);
    }
    assert.equal(translatePathname('/about', 'nb'), '/om');
    assert.equal(translatePathname('/om', 'en'), '/about');
  });

  it('keeps everything below a root page', () => {
    assert.equal(
      translatePathname('/bruker/saved-cases', 'nb'),
      '/bruker/saved-cases',
    );
    assert.equal(translatePathname('/search/a/b', 'nb'), '/s%C3%B8k/a/b');
  });

  it('respells a mappe and keeps its identifiers as they are', () => {
    assert.equal(
      translatePathname('/oslo/case/sm_1/jp_1', 'nb'),
      '/oslo/sak/sm_1/jp_1',
    );
    assert.equal(
      translatePathname('/OSLO/%C3%A1%C5%A1%C5%A1i/SM_1', 'nb'),
      '/OSLO/sak/SM_1',
    );
    assert.equal(
      translatePathname('/oslo/moete/mm_1', 'en'),
      '/oslo/meeting/mm_1',
    );
  });

  it('keeps paths without a fixed segment', () => {
    assert.equal(translatePathname('/', 'nb'), '/');
    assert.equal(translatePathname('', 'nb'), '/');
    assert.equal(translatePathname('/oslo', 'nb'), '/oslo');
    assert.equal(translatePathname('/oslo/unknown/x', 'en'), '/oslo/unknown/x');
  });

  it('encodes like toLocalizedPath', () => {
    assert.equal(translatePathname('/trøndelag', 'nb'), '/tr%C3%B8ndelag');
    assert.equal(translatePathname('/tr%c3%b8ndelag', 'nb'), '/tr%C3%B8ndelag');
    assert.equal(
      translatePathname('/oslo/sak/A%2FB', 'en'),
      '/oslo/case/A%2FB',
    );
  });

  it('agrees with toLocalizedPath between every pair of languages', () => {
    // The routes are mixed, so their values can't be typed per route.
    const localize = toLocalizedPath as (
      languageCode: LanguageCode,
      route: Route,
      ...values: string[]
    ) => string;
    for (const route of ['/', ...Object.keys(ROUTES)] as Route[]) {
      const values = (route.match(/\[/g) ?? []).map((_, index) => `ø/${index}`);
      for (const from of supportedLanguages) {
        for (const to of supportedLanguages) {
          const href = localize(from, route, ...values);
          assert.equal(
            translatePathname(href, to),
            localize(to, route, ...values),
            `${from} → ${to} ${href}`,
          );
        }
      }
    }
  });
});

describe('routeRewrites', () => {
  const withParams = (pattern: string) =>
    pattern.replace(':enhet', 'oslo').replace(':rest*', 'a/b');

  // As Next applies `beforeFiles` rewrites: in order, each to the last result.
  const applyRewrites = (pathname: string) =>
    routeRewrites().reduce((path, { source, destination }) => {
      const token = /\/:rest\*|:\w+/g;
      const pattern = source.replace(token, (param) =>
        param === '/:rest*' ? '(/.+)?' : '([^/]+)',
      );
      const match = new RegExp(`^${pattern}$`).exec(path);
      let group = 1;
      return match
        ? destination.replace(token, () => match[group++] ?? '')
        : path;
    }, pathname);

  it('is what next.config.ts serves', async () => {
    assert.deepEqual(await nextConfig.rewrites?.(), {
      beforeFiles: routeRewrites(),
    });
  });

  it('resolves a path translated at every level', () => {
    for (const [path, folders] of [
      ['/logg-inn/opprett-konto', '/login/register'],
      ['/logg-inn/gl%C3%B8ymt-passord', '/login/forgotten-password'],
      ['/s%C3%B8k/a', '/search/a'],
      ['/oslo/%C3%A1%C5%A1%C5%A1i/sm_1/jp_1', '/oslo/saksmappe/sm_1/jp_1'],
      ['/oslo/meeting/mm_1', '/oslo/moetemappe/mm_1'],
    ]) {
      assert.equal(applyRewrites(path), folders, path);
    }
  });

  it('reads each source as the same folders as its destination', () => {
    const rewrites = routeRewrites();
    assert.ok(rewrites.length > 0);

    for (const { source, destination } of rewrites) {
      assert.notEqual(source, destination);
      const folders = resolvePath(withParams(destination));
      assert.ok(folders.length > 0, destination);
      assert.deepEqual(resolvePath(withParams(source)), folders, source);
    }
  });
});
