import { Suspense } from 'react';
import CalendarContainer from '~/features/calendar/CalendarContainer';
import { getCalendarResults } from '~/features/calendar/calendarActions';
import {
  type DateRange,
  resolveCalendarDateRange,
} from '~/features/calendar/calendarHelpers';

// Async component that owns the slow fetch. Suspends until data is ready,
// then streams the real CalendarContainer into the page.
async function CalendarResults({
  enhet,
  searchParams,
  dateRange,
}: {
  enhet: string;
  searchParams: URLSearchParams;
  dateRange: DateRange;
}) {
  const calendarResults = await getCalendarResults(
    enhet,
    searchParams,
    dateRange,
  );
  return <CalendarContainer calendarResults={calendarResults} />;
}

export default async function Calendar({
  params,
  searchParams,
}: {
  params: Promise<{ enhet: string }>;
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const { enhet = '' } = await params;
  const urlSearchParams = new URLSearchParams(await searchParams);
  const dateRange = resolveCalendarDateRange(urlSearchParams);

  return (
    <Suspense
      fallback={
        <CalendarContainer calendarResults={[]} initialLoading={true} />
      }
    >
      <CalendarResults
        enhet={enhet}
        searchParams={urlSearchParams}
        dateRange={dateRange}
      />
    </Suspense>
  );
}
