import assert from 'node:assert';
import { describe, test } from 'node:test';

import { formatPhoneNumber } from './phoneNumber';

describe('formatPhoneNumber', () => {
  test('groups eight digits in pairs without +47', () => {
    const expected = { text: '21 80 21 80', href: 'tel:+4721802180' };
    assert.deepStrictEqual(formatPhoneNumber('21802180', 'nb'), expected);
    assert.deepStrictEqual(formatPhoneNumber(' 218 02 180', 'nn'), expected);
    assert.deepStrictEqual(formatPhoneNumber('+47 21802180', 'se'), expected);
    assert.deepStrictEqual(formatPhoneNumber('0047 21802180', 'nb'), expected);
  });

  test('adds +47 in English', () => {
    const expected = { text: '+47 21 80 21 80', href: 'tel:+4721802180' };
    assert.deepStrictEqual(formatPhoneNumber('21802180', 'en'), expected);
    assert.deepStrictEqual(formatPhoneNumber('+4721802180', 'en'), expected);
    assert.deepStrictEqual(formatPhoneNumber('004721802180', 'en'), expected);
  });

  test('keeps five-digit short numbers without +47', () => {
    const expected = { text: '02180', href: 'tel:02180' };
    assert.deepStrictEqual(formatPhoneNumber('02180', 'nb'), expected);
    assert.deepStrictEqual(formatPhoneNumber('021 80', 'en'), expected);
  });

  test('shows other numbers unchanged and unlinked', () => {
    assert.deepStrictEqual(formatPhoneNumber('3230000', 'nb'), {
      text: '3230000',
    });
    assert.deepStrictEqual(formatPhoneNumber('+46 8 123 45', 'en'), {
      text: '+46 8 123 45',
    });
  });
});
