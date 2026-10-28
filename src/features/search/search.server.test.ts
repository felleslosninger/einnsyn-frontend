import assert from 'node:assert';
import { mock, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import type {
  Base,
  PaginatedList,
  SearchParameters,
} from '@digdir/einnsyn-sdk';

const apiUrl = pathToFileURL('src/lib/api/api.server.ts').href;

let currentSearch: (
  query: SearchParameters,
) => Promise<PaginatedList<Base>> = async () => ({ items: [] });

mock.module(apiUrl, {
  namedExports: {
    cachedApiClient: async () => ({
      search: {
        search: (query: SearchParameters) => currentSearch(query),
      },
    }),
  },
});

let moduleSequence = 0;

async function freshSearchServer(
  search: (query: SearchParameters) => Promise<PaginatedList<Base>>,
) {
  currentSearch = search;
  moduleSequence += 1;
  return import(`./search.server.ts?test=${moduleSequence}`);
}

test('keeps unknown prefixes in the search query', async () => {
  let apiQuery: SearchParameters | undefined;
  const { getSearchResults } = await freshSearchServer(async (query) => {
    apiQuery = query;
    return { items: [] };
  });

  await getSearchResults('', new URLSearchParams('q=foo%3Abar'));

  assert.strictEqual(apiQuery?.query, 'foo:bar');
});

test('keeps supported filter prefixes out of the free-text query', async () => {
  let apiQuery: SearchParameters | undefined;
  const { getSearchResults } = await freshSearchServer(async (query) => {
    apiQuery = query;
    return { items: [] };
  });

  await getSearchResults(
    '',
    new URLSearchParams('q=publisert%3A2024-01-01+bar'),
  );

  assert.strictEqual(apiQuery?.query, 'bar');
  assert.ok(apiQuery?.publisertDatoFrom);
});
