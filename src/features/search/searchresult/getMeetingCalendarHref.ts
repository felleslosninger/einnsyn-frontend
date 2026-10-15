import { createEvent } from 'ics';
import type { Moetemappe } from '@digdir/einnsyn-sdk';

type CalendarMeeting = Pick<Moetemappe, 'moetedato' | 'moetested' | 'offentligTittel'>;

export function getMeetingCalendarHref(
  meeting: CalendarMeeting,
): string | undefined {
  const date = new Date(meeting.moetedato);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const { error, value } = createEvent({
    title: meeting.offentligTittel,
    start: [
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
    ],
    startInputType: 'utc',
    startOutputType: 'utc',
    duration: { hours: 1 },
    location: meeting.moetested,
  });

  if (error || !value) {
    return undefined;
  }

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(value)}`;
}