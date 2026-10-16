import assert from 'node:assert';
import { test } from 'node:test';
import { getHeaderRootPath } from './headerPath';

test('uses the generic search section for the default search path', () => {
  assert.strictEqual(getHeaderRootPath('/search', 'search'), 'search');
});

test('uses the generic search section for translated search paths', () => {
  assert.strictEqual(getHeaderRootPath('/søk', 'søk'), 'search');
  assert.strictEqual(getHeaderRootPath('/oza', 'oza'), 'search');
});

test('uses the generic search section for URL-encoded translated paths', () => {
  assert.strictEqual(getHeaderRootPath('/s%C3%B8k', 'søk'), 'search');
});

test('keeps other routes and the home page unchanged', () => {
  assert.strictEqual(getHeaderRootPath('/enhet', 'search'), 'enhet');
  assert.strictEqual(getHeaderRootPath('/', 'search'), 'home');
});