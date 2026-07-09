import { Suspense } from 'react';
import CalendarContainer from '~/features/calendar/CalendarContainer';
import { getCalendarResults } from '~/features/calendar/calendarActions';
import {
  type DateRange,
  resolveCalendarDateRange,
} from '~/features/calendar/calendarHelpers';

// Fetches the calendar data — kept in its own component so the outer page
// can wrap it in Suspense and stream in the interactive container first.
async function CalendarResults({
  enhet,
  dateRange,
}: {
  enhet: string;
  dateRange: DateRange;
}) {
  const results = await getCalendarResults(enhet, dateRange);
  return <CalendarContainer calendarResults={results} />;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const params = new URLSearchParams(await searchParams);
  const enhet = params.get('enhet') ?? '';
  const dateRange = resolveCalendarDateRange(params);

  return (
    <Suspense
      // Keyed on the fetch inputs so navigation to a new range re-suspends
      // and the loading state actually shows.
      key={`${enhet}|${dateRange.from}|${dateRange.to}`}
      fallback={<CalendarContainer calendarResults={[]} initialLoading />}
    >
      <CalendarResults enhet={enhet} dateRange={dateRange} />
    </Suspense>
  );
}
