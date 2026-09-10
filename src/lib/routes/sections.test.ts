import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { describe, it } from 'node:test';
import nextConfig from '../../../next.config';
import {
  getJournalpostFromPath,
  getPathEnhet,
  getSaksmappeFromPath,
  getSection,
  isModalSection,
  sectionDepth,
  sectionPaths,
  showsSearchField,
  showsSearchResults,
} from './sections';

describe('getSection', () => {
  it('reads the canonical route-folder name', () => {
    assert.equal(getSection('/search'), 'search');
    assert.equal(getSection('/saksmappe/abc'), 'saksmappe');
    assert.equal(getSection('/moetemappe/abc'), 'moetemappe');
    assert.equal(getSection('/admin'), 'admin');
    assert.equal(getSection('/login'), 'login');
    assert.equal(getSection('/about'), 'about');
    assert.equal(getSection('/privacy'), 'privacy');
  });

  it('reads a translated segment in any supported language', () => {
    assert.equal(getSection('/søk'), 'search');
    assert.equal(getSection('/oza'), 'search');
    assert.equal(getSection('/sak/abc'), 'saksmappe');
    assert.equal(getSection('/case/abc'), 'saksmappe');
    assert.equal(getSection('/ášši/abc'), 'saksmappe');
    assert.equal(getSection('/moete/abc'), 'moetemappe');
    assert.equal(getSection('/meeting/abc'), 'moetemappe');
    assert.equal(getSection('/čoahkkin/abc'), 'moetemappe');
    assert.equal(getSection('/om'), 'about');
    assert.equal(getSection('/personvern'), 'privacy');
  });

  it('reads a percent-encoded segment', () => {
    assert.equal(getSection('/s%C3%B8k'), 'search');
    assert.equal(getSection('/%C3%A1%C5%A1%C5%A1i/abc'), 'saksmappe');
    assert.equal(getSection('/%C4%8Doahkkin/abc'), 'moetemappe');
  });

  it('ignores case', () => {
    assert.equal(getSection('/SØK'), 'search');
    assert.equal(getSection('/Case/abc'), 'saksmappe');
  });

  it('is home at the root and enhet for anything unrecognised', () => {
    assert.equal(getSection('/'), 'home');
    assert.equal(getSection(''), 'home');
    assert.equal(getSection('/oslo'), 'enhet');
    // A typo is indistinguishable from an enhet slug, by design.
    assert.equal(getSection('/serach'), 'enhet');
  });

  it('only matches a section past the root segment as an enhet', () => {
    assert.equal(getSection('/oslo/search'), 'enhet');
  });
});

describe('sectionPaths', () => {
  it('lists the canonical name plus one entry per translation', () => {
    assert.deepEqual(sectionPaths('search').toSorted(), [
      'oza',
      'search',
      'søk',
    ]);
    assert.deepEqual(sectionPaths('saksmappe').toSorted(), [
      'case',
      'sak',
      'saksmappe',
      'ášši',
    ]);
  });

  it('falls back to the canonical name where a translation is missing', () => {
    // `routing.aboutPath` has no se entry, and neither has a routing key at
    // all — an untranslated section resolves by its route-folder name only.
    assert.deepEqual(sectionPaths('about').toSorted(), ['about', 'om']);
    assert.deepEqual(sectionPaths('admin'), ['admin']);
    assert.deepEqual(sectionPaths('login'), ['login']);
  });
});

describe('showsSearchResults', () => {
  it('is true for the sections that list results', () => {
    assert.equal(showsSearchResults('/'), true);
    assert.equal(showsSearchResults('/søk'), true);
    assert.equal(showsSearchResults('/oslo'), true);
  });

  it('is false for entity and static pages', () => {
    assert.equal(showsSearchResults('/sak/abc'), false);
    assert.equal(showsSearchResults('/moete/abc'), false);
    assert.equal(showsSearchResults('/login'), false);
    assert.equal(showsSearchResults('/om'), false);
  });
});

describe('showsSearchField', () => {
  it('adds the entity detail pages to the sections showing results', () => {
    assert.equal(showsSearchField('/'), true);
    assert.equal(showsSearchField('/søk'), true);
    assert.equal(showsSearchField('/oslo'), true);
    assert.equal(showsSearchField('/sak/abc'), true);
    assert.equal(showsSearchField('/moete/abc'), true);
  });

  it('is false where the header has no relationship to search', () => {
    assert.equal(showsSearchField('/login'), false);
    assert.equal(showsSearchField('/admin'), false);
    assert.equal(showsSearchField('/om'), false);
    assert.equal(showsSearchField('/personvern'), false);
  });
});

describe('getPathEnhet', () => {
  it('returns the root segment of an enhet page, normalized', () => {
    assert.equal(getPathEnhet('/oslo'), 'oslo');
    assert.equal(getPathEnhet('/OSLO'), 'oslo');
    assert.equal(getPathEnhet('/oslo/sak/abc'), 'oslo');
    assert.equal(getPathEnhet('/tr%C3%B8ndelag'), 'trøndelag');
  });

  it('is undefined anywhere that is not an enhet page', () => {
    assert.equal(getPathEnhet('/'), undefined);
    assert.equal(getPathEnhet('/søk'), undefined);
    assert.equal(getPathEnhet('/sak/abc'), undefined);
  });
});

describe('getSaksmappeFromPath', () => {
  it('reads the identifier after a saksmappe segment in any language', () => {
    assert.equal(getSaksmappeFromPath('/saksmappe/abc'), 'abc');
    assert.equal(getSaksmappeFromPath('/sak/abc'), 'abc');
    assert.equal(getSaksmappeFromPath('/case/abc'), 'abc');
    assert.equal(getSaksmappeFromPath('/ášši/abc'), 'abc');
    assert.equal(getSaksmappeFromPath('/%C3%A1%C5%A1%C5%A1i/abc'), 'abc');
  });

  it('reads it from a journalpost detail URL too', () => {
    assert.equal(getSaksmappeFromPath('/sak/abc/journalpost/xyz'), 'abc');
  });

  it('returns the identifier verbatim, still encoded', () => {
    // Callers decode it themselves; see `decodeIdentifier` in JournalpostList.
    assert.equal(getSaksmappeFromPath('/sak/a%2Fb'), 'a%2Fb');
  });

  it('is undefined without both a saksmappe segment and an identifier', () => {
    assert.equal(getSaksmappeFromPath('/saksmappe'), undefined);
    assert.equal(getSaksmappeFromPath('/'), undefined);
    assert.equal(getSaksmappeFromPath('/moete/abc'), undefined);
    assert.equal(getSaksmappeFromPath('/oslo/sak/abc'), undefined);
  });
});

describe('getJournalpostFromPath', () => {
  it('reads the identifier from a canonical journalpost URL', () => {
    assert.equal(
      getJournalpostFromPath('/saksmappe/abc/journalpost/xyz'),
      'xyz',
    );
  });

  it('accepts every locale, mixed locales included', () => {
    assert.equal(getJournalpostFromPath('/case/abc/record/xyz'), 'xyz');
    assert.equal(getJournalpostFromPath('/ášši/abc/journalapoasta/xyz'), 'xyz');
    // The rewrites combine the two segments independently, so a path mixing
    // languages resolves rather than 404-ing.
    assert.equal(getJournalpostFromPath('/sak/abc/record/xyz'), 'xyz');
    assert.equal(getJournalpostFromPath('/case/abc/journalpost/xyz'), 'xyz');
  });

  it('accepts percent-encoded fixed segments', () => {
    assert.equal(
      getJournalpostFromPath('/%C3%A1%C5%A1%C5%A1i/abc/record/xyz'),
      'xyz',
    );
  });

  it('needs exactly four segments', () => {
    assert.equal(getJournalpostFromPath('/sak/abc'), undefined);
    assert.equal(getJournalpostFromPath('/sak/abc/journalpost'), undefined);
    assert.equal(
      getJournalpostFromPath('/sak/abc/journalpost/xyz/extra'),
      undefined,
    );
  });

  it('is undefined when either fixed segment is something else', () => {
    assert.equal(
      getJournalpostFromPath('/moete/abc/journalpost/xyz'),
      undefined,
    );
    assert.equal(getJournalpostFromPath('/sak/abc/dokument/xyz'), undefined);
  });
});

describe('isModalSection', () => {
  it('marks the sections that are shown over the page beneath them', () => {
    assert.equal(isModalSection('login'), true);
    assert.equal(isModalSection('saksmappe'), false);
    assert.equal(isModalSection('home'), false);
  });

  it('agrees with the intercepted routes in app/@modal', async () => {
    const intercepted = (
      await readdir(new URL('../../app/@modal', import.meta.url))
    )
      // `(.)login` intercepts `/login`; the catch-all and default render null.
      .filter((entry) => entry.startsWith('(.)'))
      .map((entry) => getSection(`/${entry.slice('(.)'.length)}`));

    assert.deepEqual(intercepted.filter(isModalSection), intercepted);
  });
});

describe('sectionDepth', () => {
  it('puts the entity pages one level in from the results', () => {
    assert.ok(sectionDepth('saksmappe') > sectionDepth('search'));
    assert.ok(sectionDepth('moetemappe') > sectionDepth('enhet'));
    assert.ok(sectionDepth('saksmappe') > sectionDepth('home'));
  });

  it('keeps every results section on one level, so moving between them has no direction', () => {
    assert.equal(sectionDepth('home'), sectionDepth('search'));
    assert.equal(sectionDepth('search'), sectionDepth('enhet'));
    assert.equal(sectionDepth('saksmappe'), sectionDepth('moetemappe'));
  });
});

// The rewrites in next.config.ts and the lookup tables here are built from the
// same translation files but never compared, so a routing key renamed in one
// language silently desynchronises them. Reading every rewrite source and its
// destination the same way is the contract.
describe('next.config.ts rewrites', () => {
  const withIdentifiers = (pattern: string) =>
    pattern.replace(':saksmappe', 'SAK').replace(':journalpost', 'JP');

  it('reads each rewrite source exactly as its destination', async () => {
    const rewrites = await nextConfig.rewrites?.();
    assert.ok(Array.isArray(rewrites) && rewrites.length > 0);

    for (const { source, destination } of rewrites) {
      const from = withIdentifiers(source);
      const to = withIdentifiers(destination);

      assert.equal(getSection(from), getSection(to), source);
      assert.equal(
        getSaksmappeFromPath(from),
        getSaksmappeFromPath(to),
        source,
      );
      assert.equal(
        getJournalpostFromPath(from),
        getJournalpostFromPath(to),
        source,
      );
    }
  });
});
