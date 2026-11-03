import assert from 'node:assert';
import { describe, test } from 'node:test';

import { getSearchParameters } from './search.server';

const searchFor = (q: string) =>
  getSearchParameters(undefined, new URLSearchParams({ q }));

describe('getSearchParameters dates', () => {
  test('relative dates are sent as date math', () => {
    assert.strictEqual(
      searchFor('publisert:-24h').publisertDatoFrom,
      'now-24h',
    );
    assert.strictEqual(
      searchFor('publisert:-7d').publisertDatoFrom,
      'now-7d/d',
    );
    assert.strictEqual(
      searchFor('publisert:-2w').publisertDatoFrom,
      'now-2w/d',
    );
    assert.strictEqual(
      searchFor('publisert:-1y').publisertDatoFrom,
      'now-1y/d',
    );
  });

  test('m means months, not minutes', () => {
    assert.strictEqual(
      searchFor('publisert:-1m').publisertDatoFrom,
      'now-1M/d',
    );
    assert.strictEqual(
      searchFor('publisert:-1M').publisertDatoFrom,
      'now-1M/d',
    );
  });

  test('relative upper bound', () => {
    const query = searchFor('oppdatert:-1m/-7d');
    assert.strictEqual(query.oppdatertDatoFrom, 'now-1M/d');
    assert.strictEqual(query.oppdatertDatoTo, 'now-7d/d');
  });

  test('ISO dates are sent as ISO strings', () => {
    const query = searchFor('moetedato:2026-01-01/2026-01-31');
    assert.strictEqual(query.moetedatoFrom, '2026-01-01T00:00:00.000Z');
    assert.strictEqual(query.moetedatoTo, '2026-01-31T23:59:59.999Z');
  });
});
