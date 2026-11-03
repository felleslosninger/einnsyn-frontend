import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { matchesPath, type Route } from './pathname';
import { ROUTES } from './routes';
import { isModal, showsSearchField, showsSearchResults } from './sections';

describe('showsSearchResults', () => {
  it('is true for the pages that list results', () => {
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
  it('adds the entity detail pages to the pages showing results', () => {
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

describe('isModal', () => {
  it('is true for the paths that open over the page beneath them', () => {
    assert.equal(isModal('/login'), true);
    assert.equal(isModal('/logg-inn/opprett-konto'), true);
    assert.equal(isModal('/login/forgotten-password'), true);
    assert.equal(isModal('/oslo/sak/abc'), false);
    assert.equal(isModal('/'), false);
    assert.equal(isModal('/oslo/login'), false);
  });

  it('agrees with the pages in app/@modal/(modal)', async () => {
    const paths = (
      await readdir(new URL('../../app/@modal/(modal)', import.meta.url), {
        recursive: true,
      })
    )
      .filter((file) => file.endsWith('page.tsx'))
      // `(auth)/(.)login/page.tsx` intercepts `/login`: drop route groups and
      // interception markers.
      .map(
        (file) =>
          `/${file
            .split('/')
            .slice(0, -1)
            .filter((segment) => !/^\(.*\)$/.test(segment))
            .map((segment) => segment.replace(/^\(\.+\)/, ''))
            .join('/')}`,
      );

    assert.ok(paths.length > 0);
    for (const path of paths) {
      assert.equal(isModal(path), true, path);
    }
    // A root route is modal when the modal pages are at or below it.
    const rootRoutes = Object.keys(ROUTES).filter((route) =>
      /^\/[a-z][^/]*$/.test(route),
    ) as Exclude<Route, '/'>[];
    assert.ok(rootRoutes.length > 0);
    for (const route of rootRoutes) {
      assert.equal(
        isModal(route),
        paths.some((path) => !!matchesPath(path, route)),
        route,
      );
    }
  });
});
