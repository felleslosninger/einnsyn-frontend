import assert from 'node:assert';
import { describe, test } from 'node:test';

import {
  createStatisticsCache,
  getBucketStarts,
  type StatisticsQuery,
  toEnhetStatistics,
} from './statistics.server';

type StatisticsResponse = Parameters<typeof toEnhetStatistics>[0];

/** A response holding only the given buckets, as the API leaves out empty ones. */
function response(
  points: [
    time: string,
    documents: number,
    fulltext: number,
    innsynskrav: number,
  ][] = [],
): StatisticsResponse {
  return {
    summary: {
      createdCount: 0,
      createdWithFulltextCount: 0,
      createdInnsynskravCount: 0,
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
  };
}

function stubFetch() {
  const calls: [enhetId: string, query: StatisticsQuery][] = [];
  const fetchStatistics = async (enhetId: string, query: StatisticsQuery) => {
    calls.push([enhetId, query]);
    return response();
  };
  return { calls, fetchStatistics };
}

describe('getBucketStarts', () => {
  test('lists months, ending with the one the time is in', () => {
    const months = getBucketStarts(
      Date.parse('2026-10-26T12:00:00Z'),
      'month',
      12,
    );

    assert.equal(months.length, 12);
    assert.equal(months[0], '2025-11-01T00:00:00.000Z');
    assert.equal(months[11], '2026-10-01T00:00:00.000Z');
  });

  test('starts weeks on Monday, like the API', () => {
    // A Sunday.
    assert.deepStrictEqual(
      getBucketStarts(Date.parse('2026-11-08T12:00:00Z'), 'week', 2),
      ['2026-10-26T00:00:00.000Z', '2026-11-02T00:00:00.000Z'],
    );
  });

  test('lists days and hours', () => {
    const time = Date.parse('2026-11-01T00:30:00Z');

    assert.deepStrictEqual(getBucketStarts(time, 'day', 2), [
      '2026-10-31T00:00:00.000Z',
      '2026-11-01T00:00:00.000Z',
    ]);
    assert.deepStrictEqual(getBucketStarts(time, 'hour', 2), [
      '2026-10-31T23:00:00.000Z',
      '2026-11-01T00:00:00.000Z',
    ]);
  });
});

describe('toEnhetStatistics', () => {
  test('fills in the months the API leaves out', () => {
    const months = getBucketStarts(
      Date.parse('2026-10-26T12:00:00Z'),
      'month',
      12,
    );
    const statistics = toEnhetStatistics(
      response([
        ['2025-12-01T00:00:00.000Z', 5, 3, 1],
        ['2026-10-01T00:00:00.000Z', 2, 0, 0],
      ]),
      months,
    );

    assert.equal(statistics.length, 12);
    assert.deepStrictEqual(statistics[0], {
      time: '2025-11-01T00:00:00.000Z',
      createdCount: 0,
      createdWithFulltextCount: 0,
      createdInnsynskravCount: 0,
      downloadCount: 0,
    });
    assert.deepStrictEqual(statistics[1], {
      time: '2025-12-01T00:00:00.000Z',
      createdCount: 5,
      createdWithFulltextCount: 3,
      createdInnsynskravCount: 1,
      downloadCount: 0,
    });
  });
});

describe('createStatisticsCache', () => {
  test('refetches when a new month starts', async () => {
    const { calls, fetchStatistics } = stubFetch();
    const { now, set } = clock('2026-10-31T23:50:00Z');
    const get = createStatisticsCache(fetchStatistics, now);

    await get('enh_a');
    set('2026-11-01T00:10:00Z');
    const statistics = await get('enh_a');

    assert.deepStrictEqual(
      calls.map(([, query]) => query.aggregateFrom),
      ['2025-11-01', '2025-12-01'],
    );
    assert.equal(statistics[11].time, '2026-11-01T00:00:00.000Z');
  });

  test('asks the API for whole days, the last one included', async () => {
    const { calls, fetchStatistics } = stubFetch();
    const { now } = clock('2026-10-26T12:00:00Z');
    const get = createStatisticsCache(fetchStatistics, now);

    await get('enh_a');
    await get('enh_a', {
      interval: 'week',
      end: '2026-11-08',
      bucketCount: 2,
    });

    assert.deepStrictEqual(
      calls.map(([, query]) => query),
      [
        {
          aggregateFrom: '2025-11-01',
          aggregateTo: '2026-10-31',
          aggregateInterval: 'month',
        },
        {
          aggregateFrom: '2026-10-26',
          aggregateTo: '2026-11-08',
          aggregateInterval: 'week',
        },
      ],
    );
  });

  test('keeps enhets and windows apart', async () => {
    const { calls, fetchStatistics } = stubFetch();
    const { now } = clock('2026-11-08T12:00:00Z');
    const get = createStatisticsCache(fetchStatistics, now);
    // Both start on 26 October.
    const twoWeeks = { interval: 'week', bucketCount: 2 } as const;
    const fourteenDays = { interval: 'day', bucketCount: 14 } as const;

    await get('enh_a', twoWeeks);
    await get('enh_b', twoWeeks);
    await get('enh_a', fourteenDays);

    assert.equal(calls.length, 3);
  });
});
