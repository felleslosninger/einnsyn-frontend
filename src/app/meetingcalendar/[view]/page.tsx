import CalendarContainer from '~/features/meetingcalendar/CalendarContainer';
import { getCalendarResults } from '~/features/meetingcalendar/calendarActions';
import { resolveCalendarDateRange } from '~/features/meetingcalendar/calendarHelpers';

export default async function Meetingcalendar({
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
