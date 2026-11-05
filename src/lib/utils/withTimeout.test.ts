import assert from 'node:assert';
import { describe, test } from 'node:test';

import { withTimeout } from './withTimeout';

describe('withTimeout', () => {
  test('settles like the promise when it settles in time', async () => {
    assert.equal(await withTimeout(Promise.resolve('value'), 1000), 'value');
    await assert.rejects(
      withTimeout(Promise.reject(new Error('failed')), 1000),
      /failed/,
    );
  });

  test('rejects when the promise takes longer', async () => {
    const neverSettles = new Promise<never>(() => {});
    await assert.rejects(withTimeout(neverSettles, 10), /Timed out after 10/);
  });
});
