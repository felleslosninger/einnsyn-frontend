import CalendarContainer from '~/features/calendar/CalendarContainer';
import { getCalendarResults } from '~/features/calendar/calendarActions';
import { resolveCalendarDateRange } from '~/features/calendar/calendarHelpers';

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
  const calendarResults = await getCalendarResults(
    enhet,
    urlSearchParams,
    dateRange,
  );

  return <CalendarContainer calendarResults={calendarResults} />;
}
