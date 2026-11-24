import 'server-only';

import type EInnsynClient from '@digdir/einnsyn-sdk';
import type { StatisticsParameters } from '@digdir/einnsyn-sdk';
import { getPublicApiClient } from '~/lib/api/api.server';
import { createPromiseCache } from '~/lib/utils/promiseCache';

type StatisticsResponse = Awaited<
  ReturnType<EInnsynClient['statistics']['query']>
>;

export type StatisticsInterval = NonNullable<
  StatisticsParameters['aggregateInterval']
>;

// Every search with an enhet selected asks for these, and a month's counts
// barely move within the hour.
export const STATISTICS_TTL_MS = 60 * 60 * 1000;

export type StatisticsPoint = NonNullable<
  StatisticsResponse['timeSeries']
>[number];

/** A point per bucket, oldest first. */
export type EnhetStatistics = StatisticsPoint[];

export type StatisticsOptions = {
  /** Defaults to `'month'`. */
  interval?: StatisticsInterval;
  /** A time in the last bucket. Defaults to now. */
  end?: string | number;
  /** How many buckets, ending with the one `end` is in. Defaults to 12. */
  bucketCount?: number;
};

/** The UTC start of the bucket `offset` buckets after the one `time` is in. */
function getBucketStart(
  time: number,
  interval: StatisticsInterval,
  offset: number,
): number {
  const date = new Date(time);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  switch (interval) {
    case 'year':
      return Date.UTC(year + offset, 0, 1);
    case 'month':
      return Date.UTC(year, month + offset, 1);
    case 'week':
      // Matches the API's weeks, which start on Monday.
      return Date.UTC(
        year,
        month,
        day - ((date.getUTCDay() + 6) % 7) + 7 * offset,
      );
    case 'day':
      return Date.UTC(year, month, day + offset);
    case 'hour':
      return Date.UTC(year, month, day, date.getUTCHours() + offset);
  }
}

/**
 * The start of each of the `bucketCount` buckets that end with the one `end` is
 * in, oldest first.
 */
export function getBucketStarts(
  end: number,
  interval: StatisticsInterval,
  bucketCount: number,
): string[] {
  return Array.from({ length: bucketCount }, (_, index) =>
    new Date(
      getBucketStart(end, interval, index - bucketCount + 1),
    ).toISOString(),
  );
}

/** Fills in the buckets the API leaves out of the series when they are empty. */
export function toEnhetStatistics(
  response: StatisticsResponse,
  bucketStarts: readonly string[],
): EnhetStatistics {
  const pointsByTime = new Map(
    response.timeSeries?.map((point) => [Date.parse(point.time), point]),
  );
  return bucketStarts.map(
    (start) =>
      pointsByTime.get(Date.parse(start)) ?? {
        time: start,
        createdCount: 0,
        createdWithFulltextCount: 0,
        createdInnsynskravCount: 0,
        downloadCount: 0,
      },
  );
}

export type StatisticsQuery = Required<
  Pick<
    StatisticsParameters,
    'aggregateFrom' | 'aggregateTo' | 'aggregateInterval'
  >
>;

async function queryStatistics(enhetId: string, query: StatisticsQuery) {
  // Anonymous, since the cache shares the result between users.
  const api = await getPublicApiClient();
  return api.statistics.query({
    administrativEnhet: [enhetId],
    // Saksmapper and møtemapper are folders, not documents.
    entity: ['Journalpost', 'Moetesak'],
    ...query,
  });
}

/**
 * Per-enhet statistics, held for {@link STATISTICS_TTL_MS} and shared by
 * concurrent callers. A factory only so tests can pass a fake fetch and clock.
 */
export function createStatisticsCache(
  fetchStatistics = queryStatistics,
  now: () => number = Date.now,
) {
  const cache = createPromiseCache<EnhetStatistics>(STATISTICS_TTL_MS, now);

  return (
    enhetId: string,
    {
      interval = 'month',
      end = now(),
      bucketCount = 12,
    }: StatisticsOptions = {},
  ): Promise<EnhetStatistics> => {
    const endTime = new Date(end).getTime();
    const bucketStarts = getBucketStarts(endTime, interval, bucketCount);
    const [firstStart] = bucketStarts;
    // The API takes whole days, the last one included.
    const lastMoment = getBucketStart(endTime, interval, 1) - 1;
    const query = {
      aggregateFrom: firstStart.slice(0, 10),
      aggregateTo: new Date(lastMoment).toISOString().slice(0, 10),
      aggregateInterval: interval,
    };

    return cache(`${enhetId}|${interval}|${bucketCount}`, firstStart, () =>
      fetchStatistics(enhetId, query).then((response) =>
        toEnhetStatistics(response, bucketStarts),
      ),
    );
  };
}

/**
 * An enhet's statistics, its underenheter included: the last 12 months unless
 * `options` say otherwise. Takes an id, not a slug.
 */
export const getEnhetStatistics = createStatisticsCache();
