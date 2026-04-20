import assert from 'node:assert';
import { describe, test } from 'node:test';

import {
  addEnhetId,
  parseEnhetParam,
  removeEnhetId,
  serializeEnhetParam,
} from './enhetTokenInputUtils';

describe('enhetTokenInputUtils', () => {
  test('parseEnhetParam trims and deduplicates ids', () => {
    assert.deepStrictEqual(parseEnhetParam('100, 200,100,,300'), [
      '100',
      '200',
      '300',
    ]);
  });

  test('serializeEnhetParam normalizes ids before joining', () => {
    assert.strictEqual(
      serializeEnhetParam(['100', ' 200 ', '100', '', '300']),
      '100,200,300',
    );
  });

  test('addEnhetId appends a new id once', () => {
    assert.deepStrictEqual(addEnhetId(['100'], '200'), ['100', '200']);
    assert.deepStrictEqual(addEnhetId(['100'], '100'), ['100']);
  });

  test('removeEnhetId removes only the matching id', () => {
    assert.deepStrictEqual(removeEnhetId(['100', '200', '300'], '200'), [
      '100',
      '300',
    ]);
    assert.deepStrictEqual(removeEnhetId(['100', '200'], '999'), [
      '100',
      '200',
    ]);
  });
});
