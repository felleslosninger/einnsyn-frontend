import { Suspense } from 'react';
import CalendarContainer from '~/features/calendar/CalendarContainer';
import { getCalendarResults } from '~/features/calendar/calendarActions';
import {
  type DateRange,
  resolveCalendarDateRange,
} from '~/features/calendar/calendarHelpers';

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
      fallback={<CalendarContainer calendarResults={[]} initialLoading />}
    >
      <CalendarResults enhet={enhet} dateRange={dateRange} />
    </Suspense>
  );
}
