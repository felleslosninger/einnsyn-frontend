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

// Months covered by one server fetch: prev + current + next. Mirrors
// getDateRange's month-view range.
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
      const qs = next.toString();
      replace(qs ? `${optimisticPathname}?${qs}` : optimisticPathname);
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

  // URL params that affect which meetings come back — everything except the
  // date axis (scrolling) and UI-only params.
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

  // Months confirmed loaded for the current filter — an empty month lands
  // here so its cells render blank instead of skeletons.
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(
    () => new Set(),
  );
  const loadedMonthsRef = useRef(loadedMonths);
  loadedMonthsRef.current = loadedMonths;

  // biome-ignore lint/correctness/useExhaustiveDependencies: filterKey is a trigger, not read in the body
  useEffect(() => {
    setLoadedMonths(new Set());
  }, [filterKey]);

  // Gated on !isLoading so stale in-flight results don't clear skeletons.
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

  // Publish header heights as CSS vars for the month view's sticky day-names row.
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

  // Scroll-driven visible month, decoupled from selectedDate to avoid a
  // URL-state feedback loop.
  const [visibleMonth, setVisibleMonth] = useState<Date>(selectedDate);
  useEffect(() => setVisibleMonth(selectedDate), [selectedDate]);

  // When the user settles on a scrolled-to month, sync first-of-month to
  // the URL so upstream data fetching picks up the new range. Skipped if
  // already client-cached.
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
