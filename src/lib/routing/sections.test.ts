import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { matchPath, type Route } from './pathname';
import { ROUTES } from './routes';
import { isModal, showsSearchField, showsSearchResults } from './sections';

describe('showsSearchResults and showsSearchField', () => {
  it('show only the field on case and meeting pages', () => {
    for (const path of ['/oslo/sak/abc', '/oslo/moete/abc']) {
      assert.equal(showsSearchResults(path), false, path);
      assert.equal(showsSearchField(path), true, path);
    }
  });
});

describe('isModal', () => {
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
        paths.some((path) => !!matchPath(path, route)),
        route,
      );
    }
  });
});
