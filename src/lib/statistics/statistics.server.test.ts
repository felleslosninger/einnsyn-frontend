import assert from 'node:assert';
import { describe, test } from 'node:test';

import {
  createStatisticsCache,
  getMonths,
  STATISTICS_TTL_MS,
  toEnhetStatistics,
} from './statistics.server';

type StatisticsResponse = Parameters<typeof toEnhetStatistics>[0];

/** A response holding only the given months, as the API leaves out empty ones. */
function response(
  points: [
    time: string,
    documents: number,
    fulltext: number,
    innsynskrav: number,
  ][] = [],
): StatisticsResponse {
  const sum = (column: 1 | 2 | 3) =>
    points.reduce((total, point) => total + point[column], 0);
  return {
    summary: {
      createdCount: sum(1),
      createdWithFulltextCount: sum(2),
      createdInnsynskravCount: sum(3),
      downloadCount: 0,
    },
    metadata: { aggregateInterval: 'month' },
    timeSeries: points.map(([time, documents, fulltext, innsynskrav]) => ({
      time,
      createdCount: documents,
      createdWithFulltextCount: fulltext,
      createdInnsynskravCount: innsynskrav,
      downloadCount: 0,
    })),
  };
}

function clock(start: string) {
  let t = Date.parse(start);
  return {
    now: () => t,
    set: (iso: string) => {
      t = Date.parse(iso);
    },
    advance: (ms: number) => {
      t += ms;
    },
  };
}

function stubFetch() {
  const calls: [enhetId: string, from: string][] = [];
  let failing = false;
  const fetchStatistics = async (enhetId: string, from: string) => {
    calls.push([enhetId, from]);
    if (failing) {
      throw new Error('API down');
    }
    return response();
  };
  return {
    calls,
    fetchStatistics,
    setFailing: (value: boolean) => {
      failing = value;
    },
  };
}

describe('getMonths', () => {
  test('lists 12 months, ending with the current one', () => {
    const months = getMonths(Date.parse('2026-10-26T12:00:00Z'));

    assert.equal(months.length, 12);
    assert.equal(months[0], '2025-11-01');
    assert.equal(months[11], '2026-10-01');
  });

  test('crosses a year boundary', () => {
    assert.deepStrictEqual(
      getMonths(Date.parse('2026-01-31T23:59:59Z')).slice(-3),
      ['2025-11-01', '2025-12-01', '2026-01-01'],
    );
  });
});

describe('toEnhetStatistics', () => {
  test('fills in the months the API leaves out', () => {
    const months = getMonths(Date.parse('2026-10-26T12:00:00Z'));
    const statistics = toEnhetStatistics(
      response([
        ['2025-12-01T00:00:00.000Z', 5, 3, 1],
        ['2026-10-01T00:00:00.000Z', 2, 0, 0],
      ]),
      months,
    );

    assert.equal(statistics.length, 12);
    assert.deepStrictEqual(statistics[0], {
      month: '2025-11-01',
      documents: 0,
      fulltext: 0,
      innsynskrav: 0,
    });
    assert.deepStrictEqual(statistics[1], {
      month: '2025-12-01',
      documents: 5,
      fulltext: 3,
      innsynskrav: 1,
    });
    assert.deepStrictEqual(statistics[11], {
      month: '2026-10-01',
      documents: 2,
      fulltext: 0,
      innsynskrav: 0,
    });
  });
});

describe('createStatisticsCache', () => {
  test('concurrent reads share one fetch', async () => {
    const { calls, fetchStatistics } = stubFetch();
    const { now } = clock('2026-10-26T12:00:00Z');
    const get = createStatisticsCache(fetchStatistics, now);

    const [first, second] = await Promise.all([get('enh_a'), get('enh_a')]);

    assert.equal(first, second);
    assert.deepStrictEqual(calls, [['enh_a', '2025-11-01']]);
  });

  test('holds a result until the TTL runs out', async () => {
    const { calls, fetchStatistics } = stubFetch();
    const { now, advance } = clock('2026-10-26T12:00:00Z');
    const get = createStatisticsCache(fetchStatistics, now);

    await get('enh_a');
    advance(STATISTICS_TTL_MS - 1);
    await get('enh_a');
    assert.equal(calls.length, 1);

    advance(1);
    await get('enh_a');
    assert.equal(calls.length, 2);
  });

  test('refetches when a new month starts', async () => {
    const { calls, fetchStatistics } = stubFetch();
    const { now, set } = clock('2026-10-31T23:50:00Z');
    const get = createStatisticsCache(fetchStatistics, now);

    await get('enh_a');
    set('2026-11-01T00:10:00Z');
    const statistics = await get('enh_a');

    assert.deepStrictEqual(calls, [
      ['enh_a', '2025-11-01'],
      ['enh_a', '2025-12-01'],
    ]);
    assert.equal(statistics[11].month, '2026-11-01');
  });

  test('does not hold on to a failure', async () => {
    const { calls, fetchStatistics, setFailing } = stubFetch();
    const { now } = clock('2026-10-26T12:00:00Z');
    const get = createStatisticsCache(fetchStatistics, now);

    setFailing(true);
    await assert.rejects(get('enh_a'));
    setFailing(false);
    await get('enh_a');

    assert.equal(calls.length, 2);
  });

  test('keeps enhets apart', async () => {
    const { calls, fetchStatistics } = stubFetch();
    const { now } = clock('2026-10-26T12:00:00Z');
    const get = createStatisticsCache(fetchStatistics, now);

    await get('enh_a');
    await get('enh_b');

    assert.deepStrictEqual(
      calls.map(([enhetId]) => enhetId),
      ['enh_a', 'enh_b'],
    );
  });
});
