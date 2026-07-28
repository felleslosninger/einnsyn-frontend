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
import { fetchCalendarPage } from './calendarActions';
import {
  type CalendarView,
  getDateRange,
  getSelectedCalendarDate,
  getSelectedCalendarView,
  getSelectedWeekendToggle,
  SELECTED_DATE_KEY,
  SELECTED_VIEW_KEY,
  SELECTED_WEEKEND_TOGGLE_KEY,
  toDateString,
} from './calendarHelpers';

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

function mergeAndSort(prev: Moetemappe[], next: Moetemappe[]): Moetemappe[] {
  const map = new Map(prev.map((r) => [r.id, r]));
  for (const r of next) {
    if (r.id) map.set(r.id, r);
  }
  return Array.from(map.values()).sort((a, b) => {
    const at = a.moetedato ? new Date(a.moetedato).getTime() : 0;
    const bt = b.moetedato ? new Date(b.moetedato).getTime() : 0;
    return at - bt;
  });
}

export default function CalendarContainer() {
  const { optimisticPathname, optimisticSearchParams, replace } =
    useNavigation();

  const enhet = optimisticSearchParams.get('enhet') ?? '';

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

  // Everything except date/view/weekend — a change here means cached data is stale.
  const filterKey = useMemo(() => {
    const params = new URLSearchParams(optimisticSearchParams.toString());
    params.delete(SELECTED_DATE_KEY);
    params.delete(SELECTED_VIEW_KEY);
    params.delete(SELECTED_WEEKEND_TOGGLE_KEY);
    return params.toString();
  }, [optimisticSearchParams]);

  const [allResults, setAllResults] = useState<Moetemappe[]>([]);
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(
    () => new Set(),
  );
  const loadedMonthsRef = useRef(loadedMonths);
  loadedMonthsRef.current = loadedMonths;

  const [isLoading, setIsLoading] = useState(false);

  // fetchIdRef: incremented to invalidate any in-flight fetch.
  // fetchedRef: keys that have been successfully fetched (don't re-fetch).
  // fetchingRef: keys currently being fetched (prevent concurrent duplicates).
  const fetchIdRef = useRef(0);
  const fetchedRef = useRef<Set<string>>(new Set());
  const fetchingRef = useRef<Set<string>>(new Set());

  // When filter params change, wipe the cache and allow re-fetching everything.
  const prevFilterKeyRef = useRef(filterKey);
  useEffect(() => {
    if (filterKey === prevFilterKeyRef.current) return;
    prevFilterKeyRef.current = filterKey;
    fetchIdRef.current++;
    fetchedRef.current = new Set();
    fetchingRef.current = new Set();
    setAllResults([]);
    setLoadedMonths(new Set());
    setIsLoading(false);
  }, [filterKey]);

  // Fetch all pages for the current view, updating results after each page.
  const fetchForView = useCallback(async () => {
    const dateRange = getDateRange(selectedDate, selectedView);
    const key =
      selectedView === 'month'
        ? monthKey(selectedDate)
        : `${dateRange.from}:${dateRange.to}`;

    if (fetchedRef.current.has(key) || fetchingRef.current.has(key)) return;
    fetchingRef.current.add(key);

    const localFetchId = ++fetchIdRef.current;
    setIsLoading(true);

    let cursor: string | undefined;
    try {
      do {
        if (localFetchId !== fetchIdRef.current) {
          fetchingRef.current.delete(key);
          return;
        }
        const page = await fetchCalendarPage(enhet, dateRange, cursor);
        if (localFetchId !== fetchIdRef.current) {
          fetchingRef.current.delete(key);
          return;
        }
        if (page.items.length > 0) {
          setAllResults((prev) => mergeAndSort(prev, page.items));
        }
        cursor = page.next ?? undefined;
      } while (cursor);

      fetchedRef.current.add(key);
      fetchingRef.current.delete(key);
      if (selectedView === 'month') {
        setLoadedMonths((prev) => new Set([...prev, key]));
      }
      setIsLoading(false);
    } catch {
      fetchingRef.current.delete(key);
      if (localFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [enhet, selectedDate, selectedView]);

  useEffect(() => {
    fetchForView();
  }, [fetchForView]);

  // Publish header heights as CSS vars for sticky positioning.
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

  // Scroll-driven visible month
  const [visibleMonth, setVisibleMonth] = useState<Date>(selectedDate);
  useEffect(() => setVisibleMonth(selectedDate), [selectedDate]);

  // When the user scrolls to an unloaded month, update the URL so fetchForView
  // picks it up.
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
