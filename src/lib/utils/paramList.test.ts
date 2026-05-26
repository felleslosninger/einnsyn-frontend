import assert from 'node:assert';
import { describe, test } from 'node:test';

import {
  addParamListValue,
  normalizeParamList,
  parseParamList,
  removeParamListValue,
  serializeParamList,
} from './paramList';

describe('paramList', () => {
  test('parseParamList trims and deduplicates values', () => {
    assert.deepStrictEqual(parseParamList('100, 200,100,,300'), [
      '100',
      '200',
      '300',
    ]);
  });

  test('parseParamList handles empty values', () => {
    assert.deepStrictEqual(parseParamList(undefined), []);
    assert.deepStrictEqual(parseParamList(null), []);
    assert.deepStrictEqual(parseParamList(''), []);
  });

  test('serializeParamList normalizes values before joining', () => {
    assert.strictEqual(
      serializeParamList(['100', ' 200 ', '100', '', '300']),
      '100,200,300',
    );
  });

  test('normalizeParamList can sort normalized values', () => {
    assert.deepStrictEqual(
      normalizeParamList(['beta', ' alpha ', 'beta'], { sort: true }),
      ['alpha', 'beta'],
    );
  });

  test('addParamListValue appends a new value once', () => {
    assert.deepStrictEqual(addParamListValue(['100'], '200'), ['100', '200']);
    assert.deepStrictEqual(addParamListValue(['100'], '100'), ['100']);
  });

  test('removeParamListValue removes only the matching value', () => {
    assert.deepStrictEqual(removeParamListValue(['100', '200', '300'], '200'), [
      '100',
      '300',
    ]);
    assert.deepStrictEqual(removeParamListValue(['100', '200'], '999'), [
      '100',
      '200',
    ]);
  });
});
