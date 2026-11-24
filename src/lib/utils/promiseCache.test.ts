import assert from 'node:assert';
import { describe, test } from 'node:test';

import { createPromiseCache } from './promiseCache';

const TTL_MS = 1000;

function setup() {
  let time = 0;
  let loads = 0;
  let failing = false;
  return {
    cache: createPromiseCache<number>(TTL_MS, () => time),
    load: async () => {
      loads++;
      if (failing) {
        throw new Error('load failed');
      }
      return loads;
    },
    loads: () => loads,
    advance: (ms: number) => {
      time += ms;
    },
    setFailing: (value: boolean) => {
      failing = value;
    },
  };
}

describe('createPromiseCache', () => {
  test('concurrent callers share one load', async () => {
    const { cache, load, loads } = setup();

    const [first, second] = await Promise.all([
      cache('key', 'v1', load),
      cache('key', 'v1', load),
    ]);

    assert.equal(first, second);
    assert.equal(loads(), 1);
  });

  test('holds a value until the TTL runs out', async () => {
    const { cache, load, loads, advance } = setup();

    await cache('key', 'v1', load);
    advance(TTL_MS - 1);
    await cache('key', 'v1', load);
    assert.equal(loads(), 1);

    advance(1);
    await cache('key', 'v1', load);
    assert.equal(loads(), 2);
  });

  test('a new version replaces the entry', async () => {
    const { cache, load, loads } = setup();

    await cache('key', 'v1', load);
    await cache('key', 'v2', load);
    await cache('key', 'v1', load);

    assert.equal(loads(), 3);
  });

  test('a replaced load that fails leaves the newer entry', async () => {
    const { cache, load, loads } = setup();
    let fail: (error: Error) => void = () => {};
    const replaced = cache(
      'key',
      'v1',
      () =>
        new Promise<number>((_, reject) => {
          fail = reject;
        }),
    );
    const newer = cache('key', 'v2', load);

    fail(new Error('load failed'));
    await assert.rejects(replaced);
    await newer;
    await cache('key', 'v2', load);

    assert.equal(loads(), 1);
  });

  test('does not hold on to a failure', async () => {
    const { cache, load, loads, setFailing } = setup();

    setFailing(true);
    await assert.rejects(cache('key', 'v1', load));
    setFailing(false);
    await cache('key', 'v1', load);

    assert.equal(loads(), 2);
  });
});
