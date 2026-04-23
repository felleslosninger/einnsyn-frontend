'use client';

import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { useCallback, useMemo, useState } from 'react';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import cn from '~/lib/utils/className';
import CalendarBody from './CalendarBody';
import styles from './CalendarContainer.module.scss';
import CalendarHeader from './CalendarHeader';
import {
  type CalendarView,
  getSelectedCalendarDate,
  getSelectedCalendarView,
  getSelectedWeekendToggle,
  SELECTED_DATE_KEY,
  SELECTED_VIEW_KEY,
  SELECTED_WEEKEND_TOGGLE_KEY,
  toDateString,
} from './calendarHelpers';

const hasWeekendMeetings = (results: Moetemappe[]) => {
  return results.some((item) => {
    const meetingDate = item.moetedato ? new Date(item.moetedato) : null;
    if (!meetingDate) return false;
    const day = meetingDate.getDay();
    return day === 0 || day === 6;
  });
};

export default function CalendarContainer({
  calendarResults,
}: {
  calendarResults: Moetemappe[];
}) {
  const { loadingSearchParamsString, searchParamsString, loading } =
    useNavigation();
  const isLoading = loading && loadingSearchParamsString !== searchParamsString;
  const { optimisticPathname, optimisticSearchParams, replace } =
    useNavigation();

  const selectedView = useMemo(
    () => getSelectedCalendarView(optimisticSearchParams),
    [optimisticSearchParams],
  );

  const selectedDate = useMemo(
    () => getSelectedCalendarDate(optimisticSearchParams),
    [optimisticSearchParams],
  );

  const displayWeekends = useMemo(
    () => getSelectedWeekendToggle(optimisticSearchParams),
    [optimisticSearchParams],
  );

  const setSearchParam = useCallback(
    (key: string, value: string) => {
      const nextSearchParams = new URLSearchParams(
        optimisticSearchParams.toString(),
      );
      if (value === '') {
        nextSearchParams.delete(key);
      } else {
        nextSearchParams.set(key, value);
      }
      const nextSearchParamsString = nextSearchParams.toString();
      replace(`${optimisticPathname}?${nextSearchParamsString}`);
    },
    [optimisticPathname, optimisticSearchParams, replace],
  );

  const setSelectedView = useCallback(
    (view: CalendarView) => setSearchParam(SELECTED_VIEW_KEY, view),
    [setSearchParam],
  );

  const setSelectedDate = useCallback(
    (date: Date) => setSearchParam(SELECTED_DATE_KEY, toDateString(date)),
    [setSearchParam],
  );

  const setDisplayWeekends = useCallback(
    (shouldDisplay: boolean) =>
      setSearchParam(
        SELECTED_WEEKEND_TOGGLE_KEY,
        shouldDisplay ? 'true' : 'false',
      ),
    [setSearchParam],
  );

  const [hasWeekendWarning, setHasWeekendWarning] = useState(false);

  useMemo(() => {
    setHasWeekendWarning(hasWeekendMeetings(calendarResults));
  }, [calendarResults]);

  return (
    <div
      className={cn(
        'container-wrapper',
        'main-content',
        styles.calendarContainer,
        selectedView === 'week'
          ? styles.weekView
          : selectedView === 'day'
            ? styles.dayView
            : styles.calendarContainer,
      )}
    >
      {/* <div className={cn('calendar-pre collapsible', styles.calendarPre)} /> */}
      <div className="container-pre collapsible" />

      <div
        className={cn(
          'calendar-content',
          styles.calendarContent,
          selectedView === 'week'
            ? styles.weekView
            : selectedView === 'day'
              ? styles.dayView
              : styles.monthView,
        )}
      >
        <CalendarHeader
          selectedView={selectedView}
          setSelectedView={setSelectedView}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          displayWeekends={displayWeekends}
          setDisplayWeekends={setDisplayWeekends}
          hasWeekendWarning={hasWeekendWarning}
          resultCount={calendarResults.length}
        />
        <CalendarBody
          isLoading={isLoading}
          selectedView={selectedView}
          selectedDate={selectedDate}
          displayWeekends={displayWeekends}
          currentCalendarResults={calendarResults}
          setSelectedView={setSelectedView}
          setSelectedDate={setSelectedDate}
        />
      </div>

      <div className="calendar-post collapsible" />
      {/* <div className="container-post collapsible" /> */}
    </div>
  );
}
