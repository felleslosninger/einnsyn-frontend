import 'server-only';

import type EInnsynClient from '@digdir/einnsyn-sdk';
import { getPublicApiClient } from '~/lib/api/api.server';
import { createPeriodCache } from '~/lib/utils/periodCache';

type StatisticsResponse = Awaited<
  ReturnType<EInnsynClient['statistics']['query']>
>;

const MONTH_COUNT = 12;

// Every search with an enhet selected asks for these, and a month's counts
// barely move within the hour.
export const STATISTICS_TTL_MS = 60 * 60 * 1000;

export type MonthlyCount = {
  /** The month's first day, `YYYY-MM-01` (UTC). */
  month: string;
  documents: number;
  /** The documents published with full text, a subset of `documents`. */
  fulltext: number;
  innsynskrav: number;
};

/** Oldest first, ending with the current month. */
export type EnhetStatistics = MonthlyCount[];

/** The first day of each of the last 12 months, the current one included. */
export function getMonths(now: number): string[] {
  const date = new Date(now);
  return Array.from({ length: MONTH_COUNT }, (_, index) =>
    new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth() - (MONTH_COUNT - 1 - index),
        1,
      ),
    )
      .toISOString()
      .slice(0, 10),
  );
}

/** Fills in the months the API leaves out of the series when they are empty. */
export function toEnhetStatistics(
  response: StatisticsResponse,
  months: readonly string[],
): EnhetStatistics {
  const pointsByMonth = new Map(
    response.timeSeries?.map((point) => [point.time.slice(0, 7), point]),
  );
  return months.map((month) => {
    const point = pointsByMonth.get(month.slice(0, 7));
    return {
      month,
      documents: point?.createdCount ?? 0,
      fulltext: point?.createdWithFulltextCount ?? 0,
      innsynskrav: point?.createdInnsynskravCount ?? 0,
    };
  });
}

async function queryStatistics(enhetId: string, aggregateFrom: string) {
  // Anonymous, since the cache shares the result between users.
  const api = await getPublicApiClient();
  return api.statistics.query({
    administrativEnhet: [enhetId],
    // Saksmapper and møtemapper are folders, not documents.
    entity: ['Journalpost', 'Moetesak'],
    aggregateFrom,
    aggregateInterval: 'month',
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
  const cache = createPeriodCache<EnhetStatistics>(STATISTICS_TTL_MS, now);

  return (enhetId: string): Promise<EnhetStatistics> => {
    const months = getMonths(now());
    const [from] = months;
    return cache(enhetId, from, () =>
      fetchStatistics(enhetId, from).then((response) =>
        toEnhetStatistics(response, months),
      ),
    );
  };
}

/** The last 12 months for an enhet and its underenheter. Takes an id, not a slug. */
export const getEnhetStatistics = createStatisticsCache();
