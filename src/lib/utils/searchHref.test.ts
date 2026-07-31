import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildEnhetSelectionHref, pathnameContainsEnhet } from './searchHref';

describe('pathnameContainsEnhet', () => {
  it('recognizes the path enhet on direct and nested routes', () => {
    assert.equal(pathnameContainsEnhet('/oslo', 'oslo'), true);
    assert.equal(pathnameContainsEnhet('/oslo/moeter', 'oslo'), true);
    assert.equal(pathnameContainsEnhet('/search', 'oslo'), false);
  });

  it('recognizes URL-encoded path enhets', () => {
    assert.equal(
      pathnameContainsEnhet('/m%C3%B8re-og-romsdal', 'møre-og-romsdal'),
      true,
    );
  });
});

describe('buildEnhetSelectionHref', () => {
  it('keeps a selected path enhet out of the query parameter', () => {
    assert.equal(
      buildEnhetSelectionHref({
        pathname: '/oslo',
        searchPathname: '/søk',
        searchParams: new URLSearchParams('q=innsyn&enhet=bergen'),
        pathEnhetValue: 'oslo',
        selectedEnhetIdentifiers: ['oslo', 'bergen'],
      }),
      '/oslo?q=innsyn&enhet=bergen',
    );
  });

  it('moves to search when the path enhet is removed', () => {
    assert.equal(
      buildEnhetSelectionHref({
        pathname: '/oslo',
        searchPathname: '/søk',
        searchParams: new URLSearchParams('q=innsyn&enhet=bergen'),
        pathEnhetValue: 'oslo',
        selectedEnhetIdentifiers: ['bergen'],
      }),
      '/søk?q=innsyn&enhet=bergen',
    );
  });

  it('moves to an unscoped search when all enhets are removed', () => {
    assert.equal(
      buildEnhetSelectionHref({
        pathname: '/oslo',
        searchPathname: '/oza',
        searchParams: new URLSearchParams('q=innsyn&enhet=bergen'),
        pathEnhetValue: 'oslo',
        selectedEnhetIdentifiers: [],
      }),
      '/oza?q=innsyn',
    );
  });
});
