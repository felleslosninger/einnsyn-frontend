import assert from 'node:assert';
import { describe, test } from 'node:test';
import { getSafeReturnUrl } from './safeReturnUrl';

describe('getSafeReturnUrl', () => {
  const appOrigin = 'https://einnsyn.example';

  test('keeps a return URL on the app origin', () => {
    assert.equal(
      getSafeReturnUrl('https://einnsyn.example/search?q=hello', appOrigin),
      'https://einnsyn.example/search?q=hello',
    );
  });

  test('allows a relative path on the app origin', () => {
    assert.equal(
      getSafeReturnUrl('/search?q=hello', appOrigin),
      'https://einnsyn.example/search?q=hello',
    );
  });

  test('sends an external URL to the app homepage', () => {
    assert.equal(
      getSafeReturnUrl('https://attacker.example/phishing', appOrigin),
      'https://einnsyn.example/',
    );
  });

  test('sends an invalid URL to the app homepage', () => {
    assert.equal(
      getSafeReturnUrl('http://[invalid', appOrigin),
      'https://einnsyn.example/',
    );
  });
});