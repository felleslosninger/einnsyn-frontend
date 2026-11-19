import assert from 'node:assert';
import { after, describe, test } from 'node:test';
import { fetchNextPageAction, fetchPreviousPageAction } from './api.actions';

const originalApiUrl = process.env.API_URL;
process.env.API_URL = 'https://api.einnsyn.no';

after(() => {
  if (originalApiUrl === undefined) {
    Reflect.deleteProperty(process.env, 'API_URL');
  } else {
    process.env.API_URL = originalApiUrl;
  }
});

describe('pagination actions', () => {
  test('rejects next-page URLs outside the API origin', async () => {
    await assert.rejects(
      fetchNextPageAction('https://attacker.example/collect'),
      { message: 'Invalid pagination URL' },
    );
  });

  test('rejects previous-page URLs outside the API origin', async () => {
    await assert.rejects(
      fetchPreviousPageAction('//attacker.example/collect'),
      { message: 'Invalid pagination URL' },
    );
  });

  test('rejects credentials and fragments in pagination URLs', async () => {
    await assert.rejects(
      fetchNextPageAction('https://user:password@api.einnsyn.no/search'),
      { message: 'Invalid pagination URL' },
    );
    await assert.rejects(fetchPreviousPageAction('/search#fragment'), {
      message: 'Invalid pagination URL',
    });
  });
});
