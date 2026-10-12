import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { describe, it } from 'node:test';
import {
  getSection,
  isModalSection,
  sectionDepth,
  showsSearchField,
  showsSearchResults,
} from './sections';

describe('getSection', () => {
  it('names root pages in any language', () => {
    assert.equal(getSection('/search'), 'search');
    assert.equal(getSection('/s%C3%B8k'), 'search');
    assert.equal(getSection('/oza'), 'search');
    assert.equal(getSection('/om'), 'about');
    assert.equal(getSection('/personvern'), 'privacy');
    assert.equal(getSection('/admin/abc/api-keys'), 'admin');
    assert.equal(getSection('/bruker/profile'), 'bruker');
    assert.equal(getSection('/login'), 'login');
  });

  it('names a mappe page, and the child below it, after the mappe', () => {
    assert.equal(getSection('/oslo/saksmappe/abc'), 'saksmappe');
    assert.equal(getSection('/oslo/case/abc'), 'saksmappe');
    assert.equal(getSection('/oslo/%C3%A1%C5%A1%C5%A1i/abc'), 'saksmappe');
    assert.equal(getSection('/oslo/sak/abc/xyz'), 'saksmappe');
    assert.equal(getSection('/oslo/moete/abc'), 'moetemappe');
    assert.equal(getSection('/oslo/%C4%8Doahkkin/abc/xyz'), 'moetemappe');
  });

  it('is home at the root and enhet for anything else', () => {
    assert.equal(getSection('/'), 'home');
    assert.equal(getSection(''), 'home');
    assert.equal(getSection('/oslo'), 'enhet');
    assert.equal(getSection('/serach'), 'enhet');
    assert.equal(getSection('/oslo/search'), 'enhet');
  });
});

describe('showsSearchResults', () => {
  it('is true for the sections that list results', () => {
    assert.equal(showsSearchResults('/'), true);
    assert.equal(showsSearchResults('/søk'), true);
    assert.equal(showsSearchResults('/oslo'), true);
  });

  it('is false for entity and static pages', () => {
    assert.equal(showsSearchResults('/oslo/sak/abc'), false);
    assert.equal(showsSearchResults('/oslo/moete/abc'), false);
    assert.equal(showsSearchResults('/login'), false);
    assert.equal(showsSearchResults('/om'), false);
  });
});

describe('showsSearchField', () => {
  it('adds the entity detail pages to the sections showing results', () => {
    assert.equal(showsSearchField('/'), true);
    assert.equal(showsSearchField('/søk'), true);
    assert.equal(showsSearchField('/oslo'), true);
    assert.equal(showsSearchField('/oslo/sak/abc'), true);
    assert.equal(showsSearchField('/oslo/moete/abc'), true);
  });

  it('is false where the header has no relationship to search', () => {
    assert.equal(showsSearchField('/login'), false);
    assert.equal(showsSearchField('/admin'), false);
    assert.equal(showsSearchField('/bruker/profile'), false);
    assert.equal(showsSearchField('/om'), false);
    assert.equal(showsSearchField('/personvern'), false);
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
