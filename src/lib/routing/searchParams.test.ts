import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { LanguageCode } from '../translation/translation';
import {
  buildQueryString,
  buildSearchHref,
  DEFAULT_SORT,
  getEnhetSelection,
} from './searchParams';

describe('buildQueryString', () => {
  it('sets a param and keeps the others', () => {
    assert.equal(
      buildQueryString({
        searchParams: new URLSearchParams('q=innsyn&enhet=oslo'),
        updates: { entity: 'Saksmappe' },
      }),
      '?q=innsyn&enhet=oslo&entity=Saksmappe',
    );
  });

  it('deletes a param given undefined or an empty string', () => {
    assert.equal(
      buildQueryString({
        searchParams: new URLSearchParams('q=innsyn&entity=Saksmappe'),
        updates: { entity: undefined },
      }),
      '?q=innsyn',
    );
    assert.equal(
      buildQueryString({
        searchParams: new URLSearchParams('q=innsyn&entity=Saksmappe'),
        updates: { q: '' },
      }),
      '?entity=Saksmappe',
    );
  });

  it('is empty when no params remain', () => {
    assert.equal(
      buildQueryString({
        searchParams: new URLSearchParams('q=innsyn'),
        updates: { q: '' },
      }),
      '',
    );
  });

  it('leaves out a param set to its default', () => {
    assert.equal(
      buildQueryString({
        searchParams: new URLSearchParams('q=innsyn&sort=enhetAsc'),
        updates: { sort: DEFAULT_SORT },
      }),
      '?q=innsyn',
    );
  });

  it('drops a carried-over param that is at its default', () => {
    assert.equal(
      buildQueryString({
        searchParams: new URLSearchParams(`sort=${DEFAULT_SORT}`),
        updates: { q: 'innsyn' },
      }),
      '?q=innsyn',
    );
  });

  it('serializes a list param', () => {
    assert.equal(
      buildQueryString({
        searchParams: undefined,
        updates: { enhet: ['oslo', 'bergen'] },
      }),
      '?enhet=oslo%2Cbergen',
    );
  });

  it('keeps the params as they are without updates', () => {
    assert.equal(
      buildQueryString({
        searchParams: new URLSearchParams('q=innsyn'),
      }),
      '?q=innsyn',
    );
  });
});

describe('getEnhetSelection', () => {
  it('puts the path enhet first, then every enhet param value', () => {
    assert.deepEqual(
      getEnhetSelection(
        'oslo',
        new URLSearchParams('enhet=bergen,tromso&enhet=bodo'),
      ),
      ['oslo', 'bergen', 'tromso', 'bodo'],
    );
  });

  it('deduplicates and skips empty values', () => {
    assert.deepEqual(
      getEnhetSelection('oslo', new URLSearchParams('enhet=oslo,,bergen')),
      ['oslo', 'bergen'],
    );
  });

  it('is empty without a path enhet or enhet param', () => {
    assert.deepEqual(
      getEnhetSelection(undefined, new URLSearchParams('q=x')),
      [],
    );
  });
});

describe('buildSearchHref', () => {
  const href = (
    pathname: string,
    query: string,
    updates: Parameters<typeof buildSearchHref>[0]['updates'],
    languageCode: LanguageCode = 'nb',
  ) =>
    buildSearchHref({
      pathname,
      searchParams: new URLSearchParams(query),
      languageCode,
      updates,
    });

  it('puts a single selected enhet in the path', () => {
    assert.equal(
      href('/s%C3%B8k', 'q=innsyn', { enhet: ['bergen'] }),
      '/bergen?q=innsyn',
    );
    assert.equal(href('/', '', { enhet: ['bergen'] }), '/bergen');
    assert.equal(
      href('/oslo', 'q=innsyn', { enhet: ['bergen'] }),
      '/bergen?q=innsyn',
    );
  });

  it('puts several enhets in the query on the search page', () => {
    assert.equal(
      href('/oslo', 'q=innsyn', { enhet: ['oslo', 'bergen'] }),
      '/s%C3%B8k?q=innsyn&enhet=oslo%2Cbergen',
    );
  });

  it('goes to the search page without an enhet', () => {
    assert.equal(
      href('/oslo', 'q=innsyn&enhet=bergen', { enhet: [] }),
      '/s%C3%B8k?q=innsyn',
    );
    assert.equal(href('/', '', { q: 'innsyn' }), '/s%C3%B8k?q=innsyn');
  });

  it('keeps the current selection without an enhet update', () => {
    assert.equal(
      href('/oslo', 'q=innsyn', { entity: 'Saksmappe' }),
      '/oslo?q=innsyn&entity=Saksmappe',
    );
    assert.equal(
      href('/s%C3%B8k', 'enhet=oslo,bergen', { q: 'innsyn' }),
      '/s%C3%B8k?enhet=oslo%2Cbergen&q=innsyn',
    );
  });

  it('moves a lone enhet from the query into the path', () => {
    assert.equal(
      href('/s%C3%B8k', 'enhet=oslo', { q: 'innsyn' }),
      '/oslo?q=innsyn',
    );
  });

  it('goes from a mappe page to its enhet', () => {
    assert.equal(href('/oslo/sak/sm_1', '', { q: 'innsyn' }), '/oslo?q=innsyn');
  });

  it('writes the search page in the given language', () => {
    assert.equal(href('/', '', { q: 'innsyn' }, 'se'), '/oza?q=innsyn');
  });
});
