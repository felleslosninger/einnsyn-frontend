import assert from 'node:assert';
import { describe, test } from 'node:test';

import { resolveLanguageCode } from './translation';

describe('translation', () => {
  describe('getLanguageCode', () => {
    test('*', () => {
      const result = resolveLanguageCode('*', ['en', 'nb', 'nn', 'se']);
      assert.strictEqual(result, 'en');
    });

    test('without q, no supported languages list', () => {
      const result = resolveLanguageCode(
        'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5',
      );
      assert.strictEqual(result, 'fr');
    });

    test('without q, missing in supported languages list', () => {
      const result = resolveLanguageCode(
        'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5',
        ['en', 'nb', 'nn', 'se'],
      );
      assert.strictEqual(result, 'en');
    });

    test('without q, in supported languages list', () => {
      const acceptedLanguages = ['en', 'nb', 'nn', 'se', 'fr'];
      const result = resolveLanguageCode<typeof acceptedLanguages>(
        'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5',
        acceptedLanguages,
      );
      assert.strictEqual(result, 'fr');
    });

    test('has higher q not in supported languages list', () => {
      const acceptedLanguages = ['en', 'nb', 'nn', 'se', 'fr'];
      const result = resolveLanguageCode<typeof acceptedLanguages>(
        'fr-CH, fr;q=0.9, en;q=0.8, de;q=1.7, *;q=0.5',
        acceptedLanguages,
      );
      assert.strictEqual(result, 'fr');
    });

    test('higher q', () => {
      const acceptedLanguages = ['en', 'nb', 'nn', 'se', 'fr', 'de'];
      const result = resolveLanguageCode<typeof acceptedLanguages>(
        'fr-CH, fr;q=0.9, en;q=0.8, de;q=1.7, *;q=0.5',
        acceptedLanguages,
      );
      assert.strictEqual(result, 'de');
    });
  });
});
