import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildEnhetSelectionHref,
  buildSearchHref,
  pathnameContainsEnhet,
} from './searchHref';

describe('buildSearchHref', () => {
  it('sets a param and keeps the others', () => {
    assert.equal(
      buildSearchHref({
        pathname: '/search',
        searchParams: new URLSearchParams('q=innsyn&enhet=oslo'),
        updates: { entity: 'Saksmappe' },
      }),
      '/search?q=innsyn&enhet=oslo&entity=Saksmappe',
    );
  });

  it('deletes a param given undefined or an empty string', () => {
    assert.equal(
      buildSearchHref({
        pathname: '/search',
        searchParams: new URLSearchParams('q=innsyn&entity=Saksmappe'),
        updates: { entity: undefined },
      }),
      '/search?q=innsyn',
    );
    assert.equal(
      buildSearchHref({
        pathname: '/search',
        searchParams: new URLSearchParams('q=innsyn&entity=Saksmappe'),
        updates: { entity: '' },
      }),
      '/search?q=innsyn',
    );
  });

  it('omits the ? when no params remain', () => {
    assert.equal(
      buildSearchHref({
        pathname: '/search',
        searchParams: new URLSearchParams('q=innsyn'),
        updates: { q: '' },
      }),
      '/search',
    );
  });

  it('passes the pathname through unchanged without updates', () => {
    assert.equal(
      buildSearchHref({
        pathname: '/oslo',
        searchParams: new URLSearchParams('q=innsyn'),
      }),
      '/oslo?q=innsyn',
    );
  });
});

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
  it('keeps the path enhet in the path when it is the only selection', () => {
    assert.equal(
      buildEnhetSelectionHref({
        pathname: '/oslo',
        searchPathname: '/søk',
        searchParams: new URLSearchParams('q=innsyn&enhet=bergen'),
        pathEnhetValue: 'oslo',
        selectedEnhetIdentifiers: ['oslo'],
      }),
      '/oslo?q=innsyn',
    );
  });

  it('moves every enhet to the query once a second one is selected', () => {
    assert.equal(
      buildEnhetSelectionHref({
        pathname: '/oslo',
        searchPathname: '/søk',
        searchParams: new URLSearchParams('q=innsyn'),
        pathEnhetValue: 'oslo',
        selectedEnhetIdentifiers: ['oslo', 'bergen'],
      }),
      '/søk?q=innsyn&enhet=oslo%2Cbergen',
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

  it('drops the ? when the last enhet leaves an otherwise empty query', () => {
    assert.equal(
      buildEnhetSelectionHref({
        pathname: '/oslo',
        searchPathname: '/søk',
        searchParams: new URLSearchParams('enhet=bergen'),
        pathEnhetValue: 'oslo',
        selectedEnhetIdentifiers: [],
      }),
      '/søk',
    );
  });
});
