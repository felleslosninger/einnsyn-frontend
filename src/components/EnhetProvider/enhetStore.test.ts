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

type ListResult = { enhets?: TrimmedEnhet[]; version: string };

let storeSeq = 0;
let currentGetList: (knownVersion?: string) => Promise<ListResult> =
  async () => {
    throw new Error('no list stubbed');
  };

// One mock for the whole file — a module cannot be mocked twice — delegating to
// whatever the running test set.
mock.module(actionsUrl, {
  namedExports: {
    getTrimmedEnhetList: (knownVersion?: string) =>
      currentGetList(knownVersion),
  },
});

/**
 * A store with its own module state, so each test starts empty. The list fetch
 * is mocked at the server-action boundary the store imports.
 */
async function freshStore(
  getList: (knownVersion?: string) => Promise<ListResult>,
) {
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

    await store.ensureEnhetListLoaded();

    const snapshot = store.getEnhetStoreSnapshot();
    assert.equal(snapshot.loadedVersion, 'v1');
    assert.equal(snapshot.enhetMap.get('a')?.id, 'a');
  });

  test('a list the server finds current is kept', async () => {
    const asked: (string | undefined)[] = [];
    const store = await freshStore(async (knownVersion) => {
      asked.push(knownVersion);
      return knownVersion === 'v1'
        ? { version: 'v1' }
        : { enhets: [enhet('a')], version: 'v1' };
    });
    await store.ensureEnhetListLoaded();

    await store.ensureEnhetListLoaded();

    assert.deepEqual(asked, [undefined, 'v1'], 'it sends the version it holds');
    const snapshot = store.getEnhetStoreSnapshot();
    assert.equal(snapshot.loadedVersion, 'v1');
    assert.equal(snapshot.enhetMap.get('a')?.id, 'a');
  });

  test('a moved version replaces the list', async () => {
    const removed = { ...enhet('b'), slug: 'b-slug' };
    let list: ListResult = {
      enhets: [enhet('a', 'Old name'), removed],
      version: 'v1',
    };
    const store = await freshStore(async () => list);
    await store.ensureEnhetListLoaded();

    list = { enhets: [enhet('a', 'New name')], version: 'v2' };
    await store.ensureEnhetListLoaded();

    const { enhetMap, loadedVersion } = store.getEnhetStoreSnapshot();
    assert.equal(loadedVersion, 'v2');
    assert.equal(enhetMap.get('a')?.navn, 'New name');
    assert.equal(enhetMap.has('b'), false, 'the removed enhet is gone');
    assert.equal(enhetMap.has('b-slug'), false, 'and so is its alias');
  });

  test('a seed keeps the entries the store holds', async () => {
    const store = await freshStore(async () => ({
      enhets: [enhet('a', 'Listed')],
      version: 'v1',
    }));
    await store.ensureEnhetListLoaded();

    store.seedEnhets([enhet('a', 'Seeded'), enhet('b')]);

    const { enhetMap } = store.getEnhetStoreSnapshot();
    assert.equal(enhetMap.get('a')?.navn, 'Listed');
    assert.equal(enhetMap.get('b')?.id, 'b');
  });

  test('concurrent calls share one request', async () => {
    const gate = gatedList(() => ({ enhets: [enhet('a')], version: 'v1' }));
    const store = await freshStore(gate.getList);

    const first = store.ensureEnhetListLoaded();
    const second = store.ensureEnhetListLoaded();
    assert.equal(gate.started(), 1, 'the in-flight request is reused');

    gate.release();
    await Promise.all([first, second]);
  });
});
