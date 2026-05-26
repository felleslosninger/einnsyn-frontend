'use client';

import type { Moetemappe } from '@digdir/einnsyn-sdk';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

  const calendarHeaderRef = useRef<HTMLDivElement | null>(null);

  // Keep --calendar-header-height in sync so the sticky day-names row in the
  // month view can clear both the global header and this calendar header.
  // useLayoutEffect so the variable is set before the first paint — avoids
  // the day-names row sticking at the wrong position on initial render.
  useLayoutEffect(() => {
    const update = () => {
      const h = calendarHeaderRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty(
        '--calendar-header-height',
        `${h}px`,
      );
    };
    update();
    const ro = new ResizeObserver(update);
    if (calendarHeaderRef.current) ro.observe(calendarHeaderRef.current);
    return () => ro.disconnect();
  }, []);

  const [hasWeekendWarning, setHasWeekendWarning] = useState(false);

  useMemo(() => {
    setHasWeekendWarning(hasWeekendMeetings(calendarResults));
  }, [calendarResults]);

  // Local, scroll-driven "currently visible month" in the Month view.
  // Decoupled from selectedDate to avoid feedback loops through URL state.
  const [visibleMonth, setVisibleMonth] = useState<Date>(selectedDate);

  // When selectedDate changes externally (picker, chevrons, view switch,
  // direct URL edit), bring visibleMonth along so the header stays in sync.
  useEffect(() => {
    setVisibleMonth(selectedDate);
  }, [selectedDate]);

  // Lock page scroll in month view so only the calendar scrolls internally.
  // Week/day views let page height grow naturally to fit content.
  // Apply calendar-page class for the duration this component is mounted
  // (used for the page background gradient).
  useEffect(() => {
    document.documentElement.classList.add('calendar-page');
    return () => document.documentElement.classList.remove('calendar-page');
  }, []);

  // Debounced sync: once the user settles on a scrolled-to month, write
  // first-of-month back to the URL so upstream data fetching picks up the
  // new range. Guarded by year+month equality so intra-month scrolls don't
  // trigger refetches, and Month.tsx ignores the echo (see its
  // lastHandledSelectedKeyRef).
  useEffect(() => {
    const sameMonth =
      visibleMonth.getFullYear() === selectedDate.getFullYear() &&
      visibleMonth.getMonth() === selectedDate.getMonth();
    if (sameMonth) return;
    const id = window.setTimeout(() => {
      setSelectedDate(
        new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1),
      );
    }, 500);
    return () => window.clearTimeout(id);
  }, [visibleMonth, selectedDate, setSelectedDate]);

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
        <div ref={calendarHeaderRef} className={styles.calendarHeaderWrapper}>
          <CalendarHeader
            selectedView={selectedView}
            setSelectedView={setSelectedView}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            visibleMonth={visibleMonth}
            displayWeekends={displayWeekends}
            setDisplayWeekends={setDisplayWeekends}
            hasWeekendWarning={hasWeekendWarning}
            resultCount={calendarResults.length}
          />
        </div>
        <CalendarBody
          isLoading={isLoading}
          selectedView={selectedView}
          selectedDate={selectedDate}
          displayWeekends={displayWeekends}
          currentCalendarResults={calendarResults}
          setSelectedView={setSelectedView}
          setSelectedDate={setSelectedDate}
          setVisibleMonth={setVisibleMonth}
        />
      </div>

      {/* <div className="calendar-post collapsible" /> */}
      <div className="container-post collapsible" />
    </div>
  );
}
