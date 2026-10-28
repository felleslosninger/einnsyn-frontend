import assert from 'node:assert';
import { describe, test } from 'node:test';
import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';

import { mergeWindow } from './pagination';

type Item = Base & { title: string };

// Get a dummy PaginatedList from id:title pairs separated by spaces, in the
// server's sort order, whatever field it sorts on. The ids are only labels, so
// `a z b` is a z that sorts between a and b.
function paginatedList(
  spec: string,
  cursors: { previous?: string; next?: string } = {},
): PaginatedList<Item> {
  const items = spec.split(' ').map((token) => {
    const [id, title = id] = token.split(':');
    return { id, title, deleted: false };
  });
  return { items, ...cursors };
}

function joinIds(page: PaginatedList<Item>) {
  return page.items.map((item) => item.id).join(' ');
}

// Two loaded pages, `a b` and `c d`, of a search with more to come.
const current = paginatedList('a b c d', { next: 'after-d' });

describe('mergeWindow', () => {
  test('a refreshed first page replaces the loaded objects', () => {
    const merged = mergeWindow(
      current,
      paginatedList('a:changed b', { next: 'after-b' }),
    );
    assert.strictEqual(merged.items[0].title, 'changed');
    assert.strictEqual(joinIds(merged), 'a b c d');
    assert.strictEqual(merged.next, 'after-d');
  });

  test('keeps an item that appears inside the window', () => {
    const merged = mergeWindow(
      current,
      paginatedList('a z b', { next: 'after-b' }),
    );
    assert.strictEqual(joinIds(merged), 'a z b c d');
    assert.strictEqual(merged.next, 'after-d');
  });

  test('keeps an item that pushes the rest down a page in place', () => {
    const merged = mergeWindow(
      current,
      paginatedList('a z', { next: 'after-z' }),
    );
    assert.strictEqual(joinIds(merged), 'a z b c d');
    assert.strictEqual(merged.next, 'after-d');
  });

  test('drops an item that is gone from the window', () => {
    const merged = mergeWindow(
      current,
      paginatedList('a c', { next: 'after-c' }),
    );
    assert.strictEqual(joinIds(merged), 'a c d');
    assert.strictEqual(merged.next, 'after-d');
  });

  test('takes the cursors of a window that reaches past the loaded items', () => {
    const merged = mergeWindow(
      paginatedList('c d', { previous: 'before-c', next: 'after-d' }),
      paginatedList('a b c d e', { previous: 'before-a', next: 'after-e' }),
    );
    assert.strictEqual(joinIds(merged), 'a b c d e');
    assert.strictEqual(merged.previous, 'before-a');
    assert.strictEqual(merged.next, 'after-e');
  });

  test('keeps loaded items on both sides of a window in the middle', () => {
    const merged = mergeWindow(
      paginatedList('a b c d e', { previous: 'before-a', next: 'after-e' }),
      paginatedList('b:changed d', { previous: 'before-b', next: 'after-d' }),
    );
    assert.strictEqual(joinIds(merged), 'a b d e');
    assert.strictEqual(merged.items[1].title, 'changed');
    assert.strictEqual(merged.previous, 'before-a');
    assert.strictEqual(merged.next, 'after-e');
  });

  test('returns the incoming window when nothing overlaps', () => {
    const incoming = paginatedList('x y', { next: 'after-y' });
    assert.strictEqual(mergeWindow(current, incoming), incoming);
  });
});
