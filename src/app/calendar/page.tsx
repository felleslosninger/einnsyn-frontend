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
    // No `key` on Suspense: subsequent URL changes (e.g. the month view
    // syncing scroll position to ?date=…) must not force-remount the tree,
    // otherwise Month.tsx's client refs reset and it re-scrolls to
    // first-of-month. Next.js soft nav + loading state via NavigationProvider
    // handles the transition without a fallback flash.
    <Suspense
      fallback={<CalendarContainer calendarResults={[]} initialLoading />}
    >
      <CalendarResults enhet={enhet} dateRange={dateRange} />
    </Suspense>
  );
}
