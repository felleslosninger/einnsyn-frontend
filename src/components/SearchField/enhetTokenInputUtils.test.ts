import assert from 'node:assert';
import { describe, test } from 'node:test';

import {
  enhetParamToQuery,
  getActiveEnhetFilterSegment,
  getEnhetIdsFromQuery,
  insertEnhetToken,
  removeEnhetToken,
} from './enhetTokenInputUtils';

describe('enhetTokenInputUtils', () => {
  test('converts enhet URL param to token query', () => {
    assert.strictEqual(enhetParamToQuery('123,456'), 'enhet:123 enhet:456');
  });

  test('extracts unique enhet ids from query', () => {
    assert.deepStrictEqual(
      getEnhetIdsFromQuery('enhet:123 foo enhet:456 enhet:123'),
      ['123', '456'],
    );
  });

  test('active filter spans between nearest enhet tokens', () => {
    const query = 'enhet:100 alpha beta enhet:200';
    const caretPosition = query.indexOf('beta') + 2;
    assert.deepStrictEqual(getActiveEnhetFilterSegment(query, caretPosition), {
      start: 'enhet:100'.length,
      end: query.indexOf('enhet:200'),
      value: 'alpha beta',
      canReplace: true,
    });
  });

  test('active filter is empty for active prefixed token', () => {
    const query = 'foo:bar enhet:100';
    const caretPosition = query.indexOf('bar') + 1;
    assert.deepStrictEqual(getActiveEnhetFilterSegment(query, caretPosition), {
      start: 0,
      end: 'foo:bar'.length,
      value: '',
      canReplace: false,
    });
  });

  test('inserting replaces active unprefixed segment', () => {
    const query = 'enhet:100 alpha beta enhet:200';
    const caretPosition = query.indexOf('alpha') + 1;
    const result = insertEnhetToken(query, caretPosition, '300');

    assert.deepStrictEqual(result, {
      query: 'enhet:100 enhet:300 enhet:200',
      caretPosition: 'enhet:100 enhet:300'.length,
    });
  });

  test('inserting in prefixed token appends enhet token', () => {
    const query = 'foo:bar';
    const caretPosition = query.indexOf('bar') + 1;
    const result = insertEnhetToken(query, caretPosition, '300');

    assert.deepStrictEqual(result, {
      query: 'foo:bar enhet:300',
      caretPosition: 'foo:bar enhet:300'.length,
    });
  });

  test('removeEnhetToken removes selected id only', () => {
    assert.strictEqual(
      removeEnhetToken('enhet:100 alpha enhet:200', '200'),
      'enhet:100 alpha',
    );
  });
});
