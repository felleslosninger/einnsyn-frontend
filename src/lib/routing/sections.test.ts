import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { describe, it } from 'node:test';
import nb from '../../resources/translations/nb/translations.json';
import {
  getSection,
  isModalSection,
  type Section,
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
  it('marks the sections that open over the page beneath them', () => {
    assert.equal(isModalSection('login'), true);
    assert.equal(isModalSection(getSection('/login/forgotten-password')), true);
    assert.equal(isModalSection(getSection('/login/register')), true);
    assert.equal(isModalSection('saksmappe'), false);
    assert.equal(isModalSection('home'), false);
    assert.equal(isModalSection(getSection('/oslo/login')), false);
  });

  it('agrees with the pages in app/@modal/(modal)', async () => {
    const sections = new Set(
      (
        await readdir(new URL('../../app/@modal/(modal)', import.meta.url), {
          recursive: true,
        })
      )
        .filter((file) => file.endsWith('page.tsx'))
        // `(auth)/(.)login/page.tsx` intercepts `/login`: drop route groups
        // and interception markers.
        .map((file) =>
          getSection(
            `/${file
              .split('/')
              .filter((segment) => !/^\(.*\)$/.test(segment))
              .map((segment) => segment.replace(/^\(\.+\)/, ''))
              .join('/')}`,
          ),
        ),
    );

    assert.ok(sections.size > 0);
    for (const section of sections) {
      assert.equal(isModalSection(section), true, section);
    }
    for (const page of Object.keys(nb.routing.root) as Section[]) {
      assert.equal(isModalSection(page), sections.has(page), page);
    }
  });
});
