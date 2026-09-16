import assert from 'node:assert';
import { describe, mock, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import type { TrimmedEnhet } from '~/lib/enhet/enhet';

const actionsUrl = pathToFileURL('src/lib/enhet/enhet.actions.ts').href;

function enhet(id: string, navn = id): TrimmedEnhet {
  return {
    id,
    slug: id,
    navn,
    navnNynorsk: undefined,
    navnEngelsk: undefined,
    navnSami: undefined,
    orgnummer: id,
    enhetstype: 'ADMINISTRATIVENHET',
    parent: 'root',
  };
}

type ListResult = { enhets: TrimmedEnhet[]; version: string };

let storeSeq = 0;
let currentGetList: () => Promise<ListResult> = async () => {
  throw new Error('no list stubbed');
};

// One mock for the whole file — a module cannot be mocked twice — delegating to
// whatever the running test set.
mock.module(actionsUrl, {
  namedExports: { getTrimmedEnhetList: () => currentGetList() },
});

/**
 * A store with its own module state, so each test starts empty. The list fetch
 * is mocked at the server-action boundary the store imports.
 */
async function freshStore(getList: () => Promise<ListResult>) {
  currentGetList = getList;
  storeSeq += 1;
  return import(`./enhetCache.ts?store=${storeSeq}`);
}

describe('enhet client cache', () => {
  test('a full list load records the version it loaded under', async () => {
    const store = await freshStore(async () => ({
      enhets: [enhet('a')],
      version: 'v1',
    }));

    await store.ensureFullList();

    const snapshot = store.getEnhetCacheSnapshot();
    assert.equal(snapshot.loadedVersion, 'v1');
    assert.equal(snapshot.enhetMap.get('a')?.id, 'a');
  });

  test('a seed carrying a new version invalidates but keeps the entries', async () => {
    const store = await freshStore(async () => ({
      enhets: [enhet('a')],
      version: 'v1',
    }));
    await store.ensureFullList();

    store.seedEnhets([], 'v2');

    const snapshot = store.getEnhetCacheSnapshot();
    assert.equal(snapshot.loadedVersion, null, 'no longer complete');
    assert.equal(
      snapshot.enhetMap.get('a')?.id,
      'a',
      'stale names beat blank ones',
    );
  });

  test('an unchanged version leaves the full list alone', async () => {
    const store = await freshStore(async () => ({
      enhets: [enhet('a')],
      version: 'v1',
    }));
    await store.ensureFullList();

    store.seedEnhets([enhet('a')], 'v1');

    assert.equal(store.getEnhetCacheSnapshot().loadedVersion, 'v1');
  });

  test('the next ensureFullList refetches after an invalidation', async () => {
    let calls = 0;
    const store = await freshStore(async () => {
      calls += 1;
      return { enhets: [enhet('a')], version: `v${calls}` };
    });

    await store.ensureFullList();
    assert.equal(calls, 1);

    // Nothing more to fetch while the version holds.
    await store.ensureFullList();
    assert.equal(calls, 1);

    store.seedEnhets([], 'moved');
    await store.ensureFullList();
    assert.equal(calls, 2, 'the resolved in-flight promise must not be reused');
  });

  test('a moved version lets a seed overwrite a cached enhet', async () => {
    const store = await freshStore(async () => ({
      enhets: [enhet('a', 'Old name')],
      version: 'v1',
    }));
    await store.ensureFullList();

    store.seedEnhets([enhet('a', 'New name')], 'v2');

    assert.equal(
      store.getEnhetCacheSnapshot().enhetMap.get('a')?.navn,
      'New name',
    );
  });

  test('a version that moves mid-fetch leaves the list invalid', async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const store = await freshStore(async () => {
      await gate;
      return { enhets: [enhet('a')], version: 'v1' };
    });

    const inflight = store.ensureFullList();
    store.seedEnhets([], 'v2');
    release?.();
    await inflight;

    const snapshot = store.getEnhetCacheSnapshot();
    assert.equal(
      snapshot.loadedVersion,
      null,
      'the fetched list is already out of date',
    );
    assert.equal(snapshot.enhetMap.get('a')?.id, 'a', 'its entries are kept');
  });
});
