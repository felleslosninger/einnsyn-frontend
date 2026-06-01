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

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

// Month keys covered by one fetch (prev + current + next), matching the
// month-view range produced by getDateRange.
const monthKeysAround = (d: Date): string[] => [
  monthKey(new Date(d.getFullYear(), d.getMonth() - 1, 1)),
  monthKey(d),
  monthKey(new Date(d.getFullYear(), d.getMonth() + 1, 1)),
];

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
  initialLoading = false,
}: {
  calendarResults: Moetemappe[];
  /** True when used as a Suspense fallback — forces skeleton display before
   *  server data has streamed in. Once the real component mounts this is
   *  always false and the normal navigation-loading flag takes over. */
  initialLoading?: boolean;
}) {
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

  // ── Client-side month cache ──────────────────────────────────────────────
  // filterKey captures every URL param that affects which meetings come back,
  // excluding the date axis (scrolling) and UI-only params (weekends toggle).
  const filterKey = useMemo(() => {
    const params = new URLSearchParams(optimisticSearchParams.toString());
    params.delete(SELECTED_DATE_KEY);
    params.delete(SELECTED_VIEW_KEY);
    params.delete(SELECTED_WEEKEND_TOGGLE_KEY);
    return params.toString();
  }, [optimisticSearchParams]);

  const prevFilterKeyRef = useRef(filterKey);
  // Ref so the merge effect can read the current value without it being a dep.
  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;

  const [allResults, setAllResults] = useState<Moetemappe[]>(calendarResults);

  // Months whose data for the current filter is confirmed loaded. A cell shows
  // skeletons while loading until its month lands here; once loaded, a month
  // with no meetings renders blank instead of skeletons.
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(
    () => new Set(),
  );
  // Mirror into a ref so the debounce effect can read it without a dep.
  const loadedMonthsRef = useRef(loadedMonths);
  loadedMonthsRef.current = loadedMonths;

  // An (optimistic) filter change invalidates every loaded month so all
  // visible cells fall back to skeletons until fresh data arrives.
  // biome-ignore lint/correctness/useExhaustiveDependencies: filterKey is a trigger, not read in the body
  useEffect(() => {
    setLoadedMonths(new Set());
  }, [filterKey]);

  // Merge incoming results into the accumulator and mark the fetched month
  // range as loaded. Gated on !isLoading so stale in-flight results don't
  // prematurely clear skeletons.
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

  const hasWeekendWarning = useMemo(
    () => hasWeekendMeetings(allResults),
    [allResults],
  );

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
  // new range. Skipped entirely when the visible month is already in the
  // client cache — no server fetch needed.
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
    <div className={cn('container-wrapper', 'main-content')}>
      <div className="container-pre collapsible" />

      <div className={cn('calendar-content', styles.calendarContent)}>
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
