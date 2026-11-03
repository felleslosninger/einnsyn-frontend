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
  matchesExactPath,
  matchesPath,
  type Route,
  resolvePath,
  routeRewrites,
  toLocalizedPath,
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

describe('matchesExactPath', () => {
  it('matches home', () => {
    assert.deepEqual(matchesExactPath('/', '/'), []);
    assert.deepEqual(matchesExactPath('', '/'), []);
    assert.equal(matchesExactPath('/search', '/'), undefined);
  });

  it('matches a root page in any language, encoding or case', () => {
    for (const path of ['/search', '/søk', '/s%C3%B8k', '/SØK', '/oza']) {
      assert.deepEqual(matchesExactPath(path, '/search'), [], path);
    }
    assert.deepEqual(matchesExactPath('/om', '/about'), []);
    assert.deepEqual(matchesExactPath('/personvern', '/privacy'), []);
    assert.deepEqual(matchesExactPath('/logg-inn', '/login'), []);
  });

  it('matches a login step in any language, encoding or case', () => {
    for (const path of [
      '/login/register',
      '/logg-inn/opprett-konto',
      '/login/create-account',
    ]) {
      assert.deepEqual(matchesExactPath(path, '/login/register'), [], path);
    }
    for (const path of [
      '/LOGIN/Forgotten-Password?x=1',
      '/logg-inn/glemt-passord',
      '/logg-inn/gl%C3%B8ymt-passord',
    ]) {
      assert.deepEqual(
        matchesExactPath(path, '/login/forgotten-password'),
        [],
        path,
      );
    }
  });

  it('matches an enhet, decoded but not case-folded', () => {
    assert.deepEqual(matchesExactPath('/oslo', '/[enhet]'), ['oslo']);
    assert.deepEqual(matchesExactPath('/OSLO', '/[enhet]'), ['OSLO']);
    assert.deepEqual(matchesExactPath('/tr%C3%B8ndelag', '/[enhet]'), [
      'trøndelag',
    ]);
    // A typo is indistinguishable from an enhet slug, by design.
    assert.deepEqual(matchesExactPath('/serach', '/[enhet]'), ['serach']);
  });

  it('never reads a root page as an enhet', () => {
    assert.equal(matchesExactPath('/search', '/[enhet]'), undefined);
    assert.equal(matchesExactPath('/S%C3%B8K', '/[enhet]'), undefined);
  });

  it('matches a mappe in any language', () => {
    for (const word of [
      'saksmappe',
      'sak',
      'case',
      'ášši',
      '%C3%A1%C5%A1%C5%A1i',
    ]) {
      assert.deepEqual(
        matchesExactPath(
          `/oslo/${word}/sm_1`,
          '/[enhet]/saksmappe/[saksmappe]',
        ),
        ['oslo', 'sm_1'],
        word,
      );
    }
    for (const word of ['moetemappe', 'moete', 'meeting', 'čoahkkin']) {
      assert.deepEqual(
        matchesExactPath(
          `/oslo/${word}/mm_1`,
          '/[enhet]/moetemappe/[moetemappe]',
        ),
        ['oslo', 'mm_1'],
        word,
      );
    }
  });

  it('matches the child below a mappe', () => {
    assert.deepEqual(
      matchesExactPath(
        '/oslo/sak/sm_1/jp_1',
        '/[enhet]/saksmappe/[saksmappe]/[journalpost]',
      ),
      ['oslo', 'sm_1', 'jp_1'],
    );
    assert.deepEqual(
      matchesExactPath(
        '/oslo/moete/mm_1/ms_1',
        '/[enhet]/moetemappe/[moetemappe]/[moetesak]',
      ),
      ['oslo', 'mm_1', 'ms_1'],
    );
  });

  it('decodes values without case-folding them', () => {
    assert.deepEqual(
      matchesExactPath('/oslo/sak/A%2FB?x=1', '/[enhet]/saksmappe/[saksmappe]'),
      ['oslo', 'A/B'],
    );
  });

  it('is undefined for any other route, including the paths below it', () => {
    assert.equal(matchesExactPath('/login/register', '/login'), undefined);
    assert.equal(matchesExactPath('/login/unknown', '/login'), undefined);
    assert.equal(matchesExactPath('/admin/abc/api-keys', '/admin'), undefined);
    assert.equal(
      matchesExactPath('/oslo/sak', '/[enhet]/saksmappe/[saksmappe]'),
      undefined,
    );
    assert.equal(
      matchesExactPath('/oslo/unknown/abc', '/[enhet]/saksmappe/[saksmappe]'),
      undefined,
    );
    assert.equal(
      matchesExactPath('/oslo/sak/sm_1', '/[enhet]/moetemappe/[moetemappe]'),
      undefined,
    );
    assert.equal(
      matchesExactPath(
        '/oslo/sak/sm_1/jp_1/extra',
        '/[enhet]/saksmappe/[saksmappe]/[journalpost]',
      ),
      undefined,
    );
  });
});

describe('matchesPath', () => {
  it('matches a route and the paths below it', () => {
    assert.deepEqual(matchesPath('/login', '/login'), []);
    assert.deepEqual(matchesPath('/logg-inn/opprett-konto', '/login'), []);
    assert.deepEqual(matchesPath('/login/unknown', '/login'), []);
    assert.deepEqual(matchesPath('/admin/abc/api-keys', '/admin'), []);
  });

  it("takes values from the route's own segments only", () => {
    assert.deepEqual(matchesPath('/oslo/sak/sm_1/jp_1', '/[enhet]'), ['oslo']);
    assert.deepEqual(
      matchesPath('/oslo/sak/sm_1/jp_1', '/[enhet]/saksmappe/[saksmappe]'),
      ['oslo', 'sm_1'],
    );
  });

  it('is undefined above or beside the route', () => {
    assert.equal(matchesPath('/login', '/login/register'), undefined);
    assert.equal(
      matchesPath('/oslo', '/[enhet]/saksmappe/[saksmappe]'),
      undefined,
    );
    assert.equal(matchesPath('/admin/abc', '/[enhet]'), undefined);
  });

  it('is not for home, which every path is below', () => {
    // @ts-expect-error Check home with `matchesExactPath`.
    assert.deepEqual(matchesPath('/search', '/'), []);
  });
});

describe('getPathEnhet', () => {
  it('returns the enhet of anything below it', () => {
    assert.equal(getPathEnhet('/oslo'), 'oslo');
    assert.equal(getPathEnhet('/OSLO'), 'oslo');
    assert.equal(getPathEnhet('/oslo/sak/sm_1'), 'oslo');
    assert.equal(getPathEnhet('/oslo/unknown'), 'oslo');
  });

  it('is undefined at the root and on root pages', () => {
    assert.equal(getPathEnhet('/'), undefined);
    assert.equal(getPathEnhet('/søk'), undefined);
    assert.equal(getPathEnhet('/admin/abc'), undefined);
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

  it('round-trips every route through matchesExactPath in every language', () => {
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
          matchesExactPath(href, route),
          values,
          `${languageCode} ${href}`,
        );
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
        param === '/:rest*' ? '(/.+)' : '([^/]+)',
      );
      const match = new RegExp(`^${pattern}$`).exec(path);
      let group = 1;
      return match ? destination.replace(token, () => match[group++]) : path;
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
