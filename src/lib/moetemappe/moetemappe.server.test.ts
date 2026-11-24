import assert from 'node:assert';
import { describe, test } from 'node:test';

import { createUpcomingMeetingsCache } from './moetemappe.server';

describe('createUpcomingMeetingsCache', () => {
  test('refetches from the new day when the Norwegian day turns', async () => {
    const calls: [enhetId: string, from: string][] = [];
    let t = Date.parse('2026-11-03T22:50:00Z');
    const get = createUpcomingMeetingsCache(
      async (enhetId, from) => {
        calls.push([enhetId, from]);
        return [];
      },
      () => t,
    );

    await get('enh_a');
    t = Date.parse('2026-11-03T23:10:00Z');
    await get('enh_a');

    assert.deepStrictEqual(calls, [
      ['enh_a', '2026-11-03'],
      ['enh_a', '2026-11-04'],
    ]);
  });
});
