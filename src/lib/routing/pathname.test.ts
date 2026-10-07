import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { describe, it } from 'node:test';
import nextConfig from '../../../next.config';
import { supportedLanguages } from '../translation/translation';
import {
  buildPathname,
  getPathEnhet,
  parsePathname,
  type Route,
  routeRewrites,
} from './pathname';

describe('parsePathname', () => {
  it('reads home', () => {
    assert.deepEqual(parsePathname('/'), { page: 'home' });
    assert.deepEqual(parsePathname(''), { page: 'home' });
  });

  it('reads a root page in any language, encoding or case', () => {
    for (const path of ['/search', '/søk', '/s%C3%B8k', '/SØK', '/oza']) {
      assert.deepEqual(parsePathname(path), { page: 'search' }, path);
    }
    assert.deepEqual(parsePathname('/om'), { page: 'about' });
    assert.deepEqual(parsePathname('/personvern'), { page: 'privacy' });
    assert.deepEqual(parsePathname('/login'), { page: 'login' });
  });

  it('reads a root page with segments below it', () => {
    assert.deepEqual(parsePathname('/admin/abc/api-keys'), { page: 'admin' });
  });

  it('reads an enhet, normalized', () => {
    assert.deepEqual(parsePathname('/oslo'), { enhetIdentifier: 'oslo' });
    assert.deepEqual(parsePathname('/OSLO'), { enhetIdentifier: 'oslo' });
    assert.deepEqual(parsePathname('/tr%C3%B8ndelag'), {
      enhetIdentifier: 'trøndelag',
    });
    // A typo is indistinguishable from an enhet slug, by design.
    assert.deepEqual(parsePathname('/serach'), { enhetIdentifier: 'serach' });
  });

  it('reads a mappe in any language', () => {
    for (const word of [
      'saksmappe',
      'sak',
      'case',
      'ášši',
      '%C3%A1%C5%A1%C5%A1i',
    ]) {
      assert.deepEqual(
        parsePathname(`/oslo/${word}/sm_1`),
        { enhetIdentifier: 'oslo', saksmappeIdentifier: 'sm_1' },
        word,
      );
    }
    for (const word of ['moetemappe', 'moete', 'meeting', 'čoahkkin']) {
      assert.deepEqual(
        parsePathname(`/oslo/${word}/mm_1`),
        { enhetIdentifier: 'oslo', moetemappeIdentifier: 'mm_1' },
        word,
      );
    }
  });

  it('reads the child below a mappe', () => {
    assert.deepEqual(parsePathname('/oslo/sak/sm_1/jp_1'), {
      enhetIdentifier: 'oslo',
      saksmappeIdentifier: 'sm_1',
      journalpostIdentifier: 'jp_1',
    });
    assert.deepEqual(parsePathname('/oslo/moete/mm_1/ms_1'), {
      enhetIdentifier: 'oslo',
      moetemappeIdentifier: 'mm_1',
      moetesakIdentifier: 'ms_1',
    });
  });

  it('decodes identifiers without case-folding them', () => {
    assert.deepEqual(parsePathname('/oslo/sak/A%2FB?x=1'), {
      enhetIdentifier: 'oslo',
      saksmappeIdentifier: 'A/B',
    });
  });

  it('is undefined below an enhet where no route matches', () => {
    assert.equal(parsePathname('/oslo/sak'), undefined);
    assert.equal(parsePathname('/oslo/unknown/abc'), undefined);
    assert.equal(parsePathname('/oslo/sak/sm_1/jp_1/extra'), undefined);
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

describe('buildPathname', () => {
  it('writes fixed segments in the given language', () => {
    assert.equal(buildPathname({ page: 'search' }, 'nb'), '/s%C3%B8k');
    assert.equal(buildPathname({ page: 'search' }, 'en'), '/search');
    assert.equal(
      buildPathname(
        { enhetIdentifier: 'oslo', saksmappeIdentifier: 'sm_1' },
        'en',
      ),
      '/oslo/case/sm_1',
    );
    assert.equal(
      buildPathname(
        {
          enhetIdentifier: 'oslo',
          moetemappeIdentifier: 'mm_1',
          moetesakIdentifier: 'ms_1',
        },
        'nn',
      ),
      '/oslo/moete/mm_1/ms_1',
    );
  });

  it('falls back to the route folder where a translation is missing', () => {
    assert.equal(buildPathname({ page: 'about' }, 'se'), '/about');
  });

  it('round-trips through parsePathname in every language', () => {
    const routes: Route[] = [
      { page: 'home' },
      { page: 'search' },
      { page: 'about' },
      { page: 'admin' },
      { enhetIdentifier: 'trøndelag' },
      { enhetIdentifier: 'oslo', saksmappeIdentifier: 'a/b' },
      {
        enhetIdentifier: 'oslo',
        saksmappeIdentifier: 'sm_1',
        journalpostIdentifier: 'jp_1',
      },
      {
        enhetIdentifier: 'oslo',
        moetemappeIdentifier: 'mm_1',
        moetesakIdentifier: 'ms_1',
      },
    ];
    for (const languageCode of supportedLanguages) {
      for (const route of routes) {
        const href = buildPathname(route, languageCode);
        assert.deepEqual(parsePathname(href), route, `${languageCode} ${href}`);
      }
    }
  });
});

describe('routeRewrites', () => {
  const withParams = (pattern: string) =>
    pattern
      .replace(':enhet', 'oslo')
      .replace(':rest*', 'a/b')
      .replace(':mappe', 'sm_1')
      .replace(':child', 'jp_1');

  it('is what next.config.ts serves', async () => {
    assert.deepEqual(await nextConfig.rewrites?.(), routeRewrites());
  });

  it('reads each source exactly as its destination', () => {
    const rewrites = routeRewrites();
    assert.ok(rewrites.length > 0);

    for (const { source, destination } of rewrites) {
      assert.notEqual(source, destination);
      assert.deepEqual(
        parsePathname(withParams(source)),
        parsePathname(withParams(destination)),
        source,
      );
    }
  });
});
