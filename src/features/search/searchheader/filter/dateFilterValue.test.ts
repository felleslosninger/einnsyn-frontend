import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDateFilterValue } from './dateFilterValue';

test('does not set an empty or default date filter', () => {
  assert.equal(getDateFilterValue('', 'all'), undefined);
  assert.equal(getDateFilterValue('all', 'all'), undefined);
});

test('keeps a selected custom date filter', () => {
  assert.equal(
    getDateFilterValue('2026-01-01/2026-01-31', 'all'),
    '2026-01-01/2026-01-31',
  );
});
