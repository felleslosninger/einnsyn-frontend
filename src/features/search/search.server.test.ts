import assert from 'node:assert';
import { mock, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';

const apiUrl = pathToFileURL('src/lib/api/api.server.ts').href;

let currentSearch: () => Promise<PaginatedList<Base>> = async () => ({
  items: [],
});

mock.module(apiUrl, {
  namedExports: {
    cachedApiClient: async () => ({
      search: { search: () => currentSearch() },
    }),
  },
});

let moduleSequence = 0;

async function freshSearchServer(search: () => Promise<PaginatedList<Base>>) {
  currentSearch = search;
  moduleSequence += 1;
  return import(`./search.server.ts?test=${moduleSequence}`);
}

test('keeps a successful empty search result', async () => {
  const { getSearchResults } = await freshSearchServer(async () => ({
    items: [],
  }));

  const result = await getSearchResults('', new URLSearchParams());

  assert.deepStrictEqual(result, { items: [] });
});

test('returns null when the search request fails', async () => {
  const { getSearchResults } = await freshSearchServer(async () => {
    throw new Error('Search API unavailable');
  });

  const result = await getSearchResults('', new URLSearchParams());

  assert.strictEqual(result, null);
});
