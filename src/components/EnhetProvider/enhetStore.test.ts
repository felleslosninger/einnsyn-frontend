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
  return import(`./enhetStore.ts?store=${storeSeq}`);
}

/**
 * A list fetch that blocks every call until `release()` is called, so a test
 * can observe the store between a fetch starting and settling.
 */
function gatedList(resultFor: (call: number) => ListResult) {
  let waiting: (() => void)[] = [];
  let calls = 0;
  const getList = async () => {
    calls += 1;
    const call = calls;
    await new Promise<void>((resolve) => {
      waiting.push(resolve);
    });
    return resultFor(call);
  };
  const release = () => {
    const pending = waiting;
    waiting = [];
    for (const resolve of pending) {
      resolve();
    }
  };
  return { getList, release, started: () => calls };
}

describe('enhet client store', () => {
  test('a full list load records the version it loaded under', async () => {
    const store = await freshStore(async () => ({
      enhets: [enhet('a')],
      version: 'v1',
    }));

    await store.ensureFullList();

    const snapshot = store.getEnhetStoreSnapshot();
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

    const snapshot = store.getEnhetStoreSnapshot();
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

    assert.equal(store.getEnhetStoreSnapshot().loadedVersion, 'v1');
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

  test('a moved version lets a seed overwrite a stored enhet', async () => {
    const store = await freshStore(async () => ({
      enhets: [enhet('a', 'Old name')],
      version: 'v1',
    }));
    await store.ensureFullList();

    store.seedEnhets([enhet('a', 'New name')], 'v2');

    assert.equal(
      store.getEnhetStoreSnapshot().enhetMap.get('a')?.navn,
      'New name',
    );
  });

  test('a re-slugged enhet drops its old slug alias', async () => {
    const store = await freshStore(async () => ({
      enhets: [{ ...enhet('a', 'Old name'), slug: 'old-slug' }],
      version: 'v1',
    }));
    await store.ensureFullList();

    store.seedEnhets([{ ...enhet('a', 'New name'), slug: 'new-slug' }], 'v2');

    const { enhetMap } = store.getEnhetStoreSnapshot();
    assert.equal(enhetMap.get('new-slug')?.navn, 'New name');
    assert.equal(enhetMap.get('a')?.navn, 'New name');
    assert.equal(
      enhetMap.has('old-slug'),
      false,
      'the old alias would resolve to the stale copy',
    );
  });

  test('a version that moves mid-fetch leaves the list invalid', async () => {
    const gate = gatedList(() => ({ enhets: [enhet('a')], version: 'v1' }));
    const store = await freshStore(gate.getList);

    const inflight = store.ensureFullList();
    store.seedEnhets([], 'v2');
    gate.release();
    await inflight;

    // The retry this kicks off is still gated, so the store is observed
    // exactly as the invalidated fetch left it.
    const snapshot = store.getEnhetStoreSnapshot();
    assert.equal(
      snapshot.loadedVersion,
      null,
      'the fetched list is already out of date',
    );
    assert.equal(snapshot.enhetMap.get('a')?.id, 'a', 'its entries are kept');
  });

  test('a seed mid-fetch does not start a second fetch', async () => {
    const gate = gatedList(() => ({ enhets: [enhet('a')], version: 'v1' }));
    const store = await freshStore(gate.getList);

    const inflight = store.ensureFullList();
    // The seed invalidates, but the fetch it would restart is still running.
    store.seedEnhets([], 'v2');
    const reentrant = store.ensureFullList();
    assert.equal(gate.started(), 1, 'the in-flight fetch is reused');

    gate.release();
    await Promise.all([inflight, reentrant]);
  });

  test('an invalidated fetch restarts itself once it settles', async () => {
    const gate = gatedList((call) => ({
      enhets: [enhet('a')],
      version: call === 1 ? 'v1' : 'v2',
    }));
    const store = await freshStore(gate.getList);

    const inflight = store.ensureFullList();
    store.seedEnhets([], 'v2');
    gate.release();
    await inflight;

    // Nobody calls `ensureFullList` again: the selector's effect only re-runs
    // when `fullListLoaded` flips, which an invalidated fetch never does.
    assert.equal(gate.started(), 2, 'the stale fetch restarts on its own');

    gate.release();
    await store.ensureFullList();

    assert.equal(
      store.getEnhetStoreSnapshot().loadedVersion,
      'v2',
      'the retry loads under the version the seed announced',
    );
  });
});
