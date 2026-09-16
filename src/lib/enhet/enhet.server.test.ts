import assert from 'node:assert';
import { describe, test } from 'node:test';

import {
  type CachedEnhet,
  createEnhetListCache,
  type FetchEnhets,
  RETRY_AFTER_FAILURE_MS,
  REVALIDATE_MS,
} from './enhet.server';

function enhet(id: string): CachedEnhet {
  return {
    id,
    entity: 'Enhet',
    deleted: false,
    slug: id,
    navn: id,
    orgnummer: id,
    kontaktpunktEpost: `${id}@example.no`,
    innsynskravEpost: `${id}@example.no`,
    enhetstype: 'ADMINISTRATIVENHET',
    parent: 'root',
  };
}

/** A fetch resolving with the nth list, or the last one once they run out. */
function stubFetch(results: CachedEnhet[][]) {
  const calls = { length: 0 };
  const fetchEnhets: FetchEnhets = async () => {
    calls.length += 1;
    const result = results[Math.min(calls.length - 1, results.length - 1)];
    if (result === undefined) {
      throw new Error('no stubbed result');
    }
    return result;
  };
  return { fetchEnhets, calls };
}

function clock(start = 1_000) {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe('createEnhetListCache', () => {
  test('a cold read resolves with the fetched list', async () => {
    const { fetchEnhets, calls } = stubFetch([[enhet('a')]]);
    const cache = createEnhetListCache(fetchEnhets, clock().now);

    assert.deepEqual((await cache.get()).enhets, [enhet('a')]);
    assert.equal(calls.length, 1);
  });

  test('concurrent cold reads share a single refresh', async () => {
    let started = 0;
    const fetchEnhets: FetchEnhets = async () => {
      started += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return [enhet('a')];
    };
    const cache = createEnhetListCache(fetchEnhets, clock().now);

    const snapshots = await Promise.all([
      cache.get(),
      cache.get(),
      cache.get(),
      cache.get(),
    ]);

    assert.equal(started, 1);
    for (const snapshot of snapshots) {
      assert.deepEqual(snapshot.enhets, [enhet('a')]);
    }
  });

  test('a fresh read does not refresh again', async () => {
    const { fetchEnhets, calls } = stubFetch([[enhet('a')]]);
    const time = clock();
    const cache = createEnhetListCache(fetchEnhets, time.now);

    await cache.get();
    time.advance(REVALIDATE_MS - 1);
    await cache.get();

    assert.equal(calls.length, 1);
  });

  test('a stale read returns the old list immediately and refreshes behind it', async () => {
    const { fetchEnhets, calls } = stubFetch([[enhet('a')], [enhet('b')]]);
    const time = clock();
    const cache = createEnhetListCache(fetchEnhets, time.now);

    await cache.get();
    time.advance(REVALIDATE_MS);

    // Still the stale list, even though this read triggered the refresh.
    assert.deepEqual((await cache.get()).enhets, [enhet('a')]);
    assert.equal(calls.length, 2);

    // The refresh lands for later readers.
    await new Promise(setImmediate);
    assert.deepEqual((await cache.get()).enhets, [enhet('b')]);
  });

  test('a failed background refresh keeps serving the last good list', async () => {
    let call = 0;
    const fetchEnhets: FetchEnhets = async () => {
      call += 1;
      if (call === 1) {
        return [enhet('a')];
      }
      throw new Error('api down');
    };
    const time = clock();
    const cache = createEnhetListCache(fetchEnhets, time.now);

    await cache.get();
    time.advance(REVALIDATE_MS);
    await cache.get();
    await new Promise(setImmediate);

    assert.deepEqual((await cache.get()).enhets, [enhet('a')]);
  });

  test('a failed cold refresh rejects, since there is nothing to serve', async () => {
    const fetchEnhets: FetchEnhets = async () => {
      throw new Error('api down');
    };
    const cache = createEnhetListCache(fetchEnhets, clock().now);

    await assert.rejects(() => cache.get(), /api down/);
  });

  test('a failed cold refresh backs off too, rather than walking per read', async () => {
    let call = 0;
    const fetchEnhets: FetchEnhets = async () => {
      call += 1;
      if (call <= 2) {
        throw new Error('api down');
      }
      return [enhet('a')];
    };
    const time = clock();
    const cache = createEnhetListCache(fetchEnhets, time.now);

    await assert.rejects(() => cache.get(), /api down/);

    time.advance(RETRY_AFTER_FAILURE_MS - 1);
    await assert.rejects(() => cache.get(), /api down/);
    assert.equal(call, 1, 'the failure is replayed, not retried');

    time.advance(1);
    await assert.rejects(() => cache.get(), /api down/);
    assert.equal(call, 2);

    time.advance(RETRY_AFTER_FAILURE_MS);
    assert.deepEqual((await cache.get()).enhets, [enhet('a')]);
  });

  test('a failed refresh backs off instead of retrying on every read', async () => {
    let call = 0;
    const fetchEnhets: FetchEnhets = async () => {
      call += 1;
      if (call === 1) {
        return [enhet('a')];
      }
      throw new Error('api down');
    };
    const time = clock();
    const cache = createEnhetListCache(fetchEnhets, time.now);

    await cache.get();
    time.advance(REVALIDATE_MS);
    await cache.get();
    await new Promise(setImmediate);
    assert.equal(call, 2);

    time.advance(RETRY_AFTER_FAILURE_MS - 1);
    await cache.get();
    await new Promise(setImmediate);
    assert.equal(call, 2, 'still backing off');

    time.advance(1);
    await cache.get();
    await new Promise(setImmediate);
    assert.equal(call, 3);
  });
});

describe('enhet list versioning', () => {
  test('the same content produces the same version', async () => {
    const a = createEnhetListCache(async () => [enhet('a'), enhet('b')]);
    const b = createEnhetListCache(async () => [enhet('a'), enhet('b')]);

    assert.equal((await a.get()).version, (await b.get()).version);
  });

  test('changed content produces a different version', async () => {
    const a = createEnhetListCache(async () => [enhet('a')]);
    const b = createEnhetListCache(async () => [enhet('a'), enhet('b')]);

    assert.notEqual((await a.get()).version, (await b.get()).version);
  });

  test('a reordered list produces the same version', async () => {
    const a = createEnhetListCache(async () => [enhet('a'), enhet('b')]);
    const b = createEnhetListCache(async () => [enhet('b'), enhet('a')]);

    assert.equal((await a.get()).version, (await b.get()).version);
  });

  test('a field the browser never receives does not move the version', async () => {
    const base = enhet('a');
    const a = createEnhetListCache(async () => [base]);
    const b = createEnhetListCache(async () => [
      { ...base, kontaktpunktEpost: 'changed@example.no' },
    ]);

    assert.equal((await a.get()).version, (await b.get()).version);
  });

  test('peekVersion never blocks on a cold cache', async () => {
    let started = 0;
    const cache = createEnhetListCache(async () => {
      started += 1;
      return [enhet('a')];
    });

    assert.equal(cache.peekVersion(), null);
    assert.equal(started, 0, 'peeking must not trigger a walk');

    const { version } = await cache.get();
    assert.equal(cache.peekVersion(), version);
  });
});
