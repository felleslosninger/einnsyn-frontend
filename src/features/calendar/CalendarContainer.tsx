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

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

// Server fetch covers prev + current + next month (see getDateRange). Mirror
// that here so the loading-tracker knows which months are hydrated by one fetch.
const monthKeysAround = (d: Date): string[] => [
  monthKey(new Date(d.getFullYear(), d.getMonth() - 1, 1)),
  monthKey(d),
  monthKey(new Date(d.getFullYear(), d.getMonth() + 1, 1)),
];

type Props = {
  calendarResults: Moetemappe[];
  initialLoading?: boolean;
};

export default function CalendarContainer({
  calendarResults,
  initialLoading = false,
}: Props) {
  const {
    loadingSearchParamsString,
    searchParamsString,
    loading,
    optimisticPathname,
    optimisticSearchParams,
    replace,
  } = useNavigation();

  const isLoading =
    initialLoading ||
    (loading && loadingSearchParamsString !== searchParamsString);

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
      const next = new URLSearchParams(optimisticSearchParams.toString());
      if (value === '') next.delete(key);
      else next.set(key, value);
      replace(`${optimisticPathname}?${next.toString()}`);
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

  // ── Client-side month cache ─────────────────────────────────────────────
  // filterKey covers every URL param that affects which meetings come back,
  // excluding date (scrolling) and UI-only params (view, weekends).
  const filterKey = useMemo(() => {
    const params = new URLSearchParams(optimisticSearchParams.toString());
    params.delete(SELECTED_DATE_KEY);
    params.delete(SELECTED_VIEW_KEY);
    params.delete(SELECTED_WEEKEND_TOGGLE_KEY);
    return params.toString();
  }, [optimisticSearchParams]);

  const prevFilterKeyRef = useRef(filterKey);
  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;

  const [allResults, setAllResults] = useState<Moetemappe[]>(calendarResults);

  // Months whose data (for the current filter) is confirmed loaded. A cell
  // shows skeletons while loading until its month is in this set; once
  // loaded, an empty month renders blank instead of skeletons.
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(
    () => new Set(),
  );
  const loadedMonthsRef = useRef(loadedMonths);
  loadedMonthsRef.current = loadedMonths;

  // Optimistic filter change → invalidate every loaded month so visible cells
  // fall back to skeletons until fresh data arrives.
  // biome-ignore lint/correctness/useExhaustiveDependencies: filterKey is a trigger, not read in the body
  useEffect(() => {
    setLoadedMonths(new Set());
  }, [filterKey]);

  // Merge incoming results and mark the fetched range as loaded. Gated on
  // !isLoading so stale in-flight results don't prematurely clear skeletons.
  useEffect(() => {
    if (isLoading) return;
    const filterChanged = filterKey !== prevFilterKeyRef.current;
    prevFilterKeyRef.current = filterKey;
    const fetchedKeys = monthKeysAround(selectedDateRef.current);

    if (filterChanged) {
      setLoadedMonths(new Set(fetchedKeys));
      setAllResults(calendarResults);
      return;
    }

    setLoadedMonths((prev) => {
      const next = new Set(prev);
      for (const k of fetchedKeys) next.add(k);
      return next;
    });
    setAllResults((prev) => {
      const map = new Map(prev.map((r) => [r.id, r]));
      for (const r of calendarResults) {
        if (r.id) map.set(r.id, r);
      }
      return Array.from(map.values()).sort((a, b) => {
        const at = a.moetedato ? new Date(a.moetedato).getTime() : 0;
        const bt = b.moetedato ? new Date(b.moetedato).getTime() : 0;
        return at - bt;
      });
    });
  }, [calendarResults, isLoading, filterKey]);
  // ─────────────────────────────────────────────────────────────────────────

  // Publish the calendar-header height as a CSS variable so the sticky
  // day-names row in the month view can clear it. useLayoutEffect so the
  // variable is set before the first paint.
  const calendarHeaderRef = useRef<HTMLDivElement | null>(null);
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

  // Same for the global page header — the month view's sticky day-names row
  // needs to clear both.
  useLayoutEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;
    const update = () => {
      document.documentElement.style.setProperty(
        '--page-header-height',
        `${header.offsetHeight}px`,
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  // Scroll-driven "currently visible month" in the month view. Decoupled
  // from selectedDate to avoid feedback loops through URL state.
  const [visibleMonth, setVisibleMonth] = useState<Date>(selectedDate);
  useEffect(() => setVisibleMonth(selectedDate), [selectedDate]);

  // Debounced sync: once the user settles on a scrolled-to month, write
  // first-of-month back to the URL so upstream data fetching picks up the
  // new range. Skipped entirely when the visible month is already cached.
  useEffect(() => {
    const sameMonth =
      visibleMonth.getFullYear() === selectedDate.getFullYear() &&
      visibleMonth.getMonth() === selectedDate.getMonth();
    if (sameMonth) return;
    if (loadedMonthsRef.current.has(monthKey(visibleMonth))) return;
    const id = window.setTimeout(() => {
      setSelectedDate(
        new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1),
      );
    }, 500);
    return () => window.clearTimeout(id);
  }, [visibleMonth, selectedDate, setSelectedDate]);

  return (
    <div className={`container-wrapper main-content ${styles.calendarWrapper}`}>
      <div className="container-pre collapsible" />

      <div className={styles.calendarContent}>
        <div ref={calendarHeaderRef} className={styles.calendarHeaderWrapper}>
          <CalendarHeader
            selectedView={selectedView}
            setSelectedView={setSelectedView}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            visibleMonth={visibleMonth}
            displayWeekends={displayWeekends}
            setDisplayWeekends={setDisplayWeekends}
          />
        </div>
        <CalendarBody
          isLoading={isLoading}
          selectedView={selectedView}
          selectedDate={selectedDate}
          displayWeekends={displayWeekends}
          currentCalendarResults={allResults}
          setVisibleMonth={setVisibleMonth}
          loadedMonths={loadedMonths}
        />
      </div>

      <div className="container-post collapsible" />
    </div>
  );
}
