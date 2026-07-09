import { Badge, Button, Heading } from '@digdir/designsystemet-react';
import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { XMarkIcon } from '@navikt/aksel-icons';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { EinButton } from '~/components/EinButton/EinButton';
import EinPopup from '~/components/EinPopup/EinPopup';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from '../CalendarContainer.module.scss';
import MoetemappeModule from '../Moetemappe';
import { MoetemappeSkeleton } from '../MoetemappeSkeleton';

// Virtualize the month strip: keep 2 * MONTHS_BUFFER + 1 = 9 months in the DOM.
const MONTHS_BUFFER = 4;
// Distance from top/bottom (in px) that triggers a prepend/append.
const SCROLL_EDGE_THRESHOLD = 400;

const WEEKDAYS_WITH_WEEKENDS = [1, 2, 3, 4, 5, 6, 0] as const;
const WEEKDAYS_WITHOUT_WEEKENDS = [1, 2, 3, 4, 5] as const;

type DayCell = {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
};

type MonthBlock = {
  year: number;
  month: number;
  weeks: DayCell[][];
};

const blockKey = (b: { year: number; month: number }) => `${b.year}-${b.month}`;

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const mondayColumn = (date: Date) => {
  const dow = date.getDay();
  return dow === 0 ? 6 : dow - 1;
};

const buildMonth = (
  year: number,
  month: number,
  displayWeekends: boolean,
): MonthBlock => {
  // Normalize month over/underflow (e.g. month = -1 or 12)
  const anchor = new Date(year, month, 1);
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const lastOfMonth = new Date(y, m + 1, 0);
  const todayStr = new Date().toDateString();

  const startCol = mondayColumn(anchor);
  const cursor = new Date(y, m, 1 - startCol);
  const weeks: DayCell[][] = [];

  while (true) {
    const week: DayCell[] = [];
    for (let c = 0; c < 7; c++) {
      const date = new Date(cursor);
      if (displayWeekends || c < 5) {
        week.push({
          date,
          inMonth: date.getFullYear() === y && date.getMonth() === m,
          isToday: date.toDateString() === todayStr,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (cursor > lastOfMonth) break;
  }

  return { year: y, month: m, weeks };
};

const buildMonthsAround = (
  center: Date,
  displayWeekends: boolean,
): MonthBlock[] => {
  const blocks: MonthBlock[] = [];
  for (let offset = -MONTHS_BUFFER; offset <= MONTHS_BUFFER; offset++) {
    const d = new Date(center.getFullYear(), center.getMonth() + offset, 1);
    blocks.push(buildMonth(d.getFullYear(), d.getMonth(), displayWeekends));
  }
  return blocks;
};

type Props = {
  isLoading: boolean;
  selectedDate: Date;
  displayWeekends: boolean;
  currentCalendarResults: Moetemappe[];
  setVisibleMonth: (date: Date) => void;
  loadedMonths: Set<string>;
};

export default function MonthView({
  isLoading,
  selectedDate,
  displayWeekends,
  currentCalendarResults,
  setVisibleMonth,
  loadedMonths,
}: Props) {
  const t = useTranslation();

  const dayHeaderRef = useRef<HTMLDivElement | null>(null);
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll compensation state:
  // - pendingAdjustRef: after a prepend/append, re-anchor the scroll so the
  //   user's viewport doesn't jump when items are added/removed.
  const pendingAdjustRef = useRef<{
    key: string;
    viewportOffset: number;
  } | null>(null);
  // - needsInitialScrollRef: on mount (and after weekends rebuild) we need
  //   to scroll to selectedDate once the DOM is measured.
  const needsInitialScrollRef = useRef(true);
  // - isProgrammaticScrollRef: prevents handleScroll from reacting to our
  //   own scrollTo calls.
  const isProgrammaticScrollRef = useRef(false);

  // The year-month we most recently centered on. Lets reportVisibleMonth
  // skip re-notifying the parent for the same month, and lets the weekends
  // rebuild keep the user's vantage point.
  const currentCenterRef = useRef({
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth(),
  });
  const lastHandledSelectedKeyRef = useRef(dateKey(selectedDate));

  // Show the last non-loading snapshot while a new fetch is in flight, so
  // the grid doesn't blank out during transitions.
  const [cachedResults, setCachedResults] = useState<Moetemappe[]>(
    currentCalendarResults,
  );
  useEffect(() => {
    if (!isLoading) setCachedResults(currentCalendarResults);
  }, [isLoading, currentCalendarResults]);

  const meetingsByDay = useMemo(() => {
    const map = new Map<string, Moetemappe[]>();
    for (const m of cachedResults) {
      if (!m.moetedato) continue;
      const k = new Date(m.moetedato).toDateString();
      const arr = map.get(k);
      if (arr) arr.push(m);
      else map.set(k, [m]);
    }
    return map;
  }, [cachedResults]);

  const [months, setMonths] = useState<MonthBlock[]>(() =>
    buildMonthsAround(selectedDate, displayWeekends),
  );
  const monthsRef = useRef(months);
  monthsRef.current = months;

  const scrollToDate = useCallback((date: Date) => {
    const key = blockKey({ year: date.getFullYear(), month: date.getMonth() });
    const block = monthRefs.current.get(key);
    if (!block) return false;
    // Sticky clearance = the day-header row's rendered bottom; accounts for
    // page header + calendar header stacked above it.
    const stickyOffset =
      dayHeaderRef.current?.getBoundingClientRect().bottom ?? 0;
    const dayEl = block.querySelector<HTMLElement>(
      `[data-day="${date.getDate()}"]`,
    );
    const target = dayEl ?? block;
    isProgrammaticScrollRef.current = true;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - stickyOffset,
    });
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
    return true;
  }, []);

  // Rebuild the month strip when the weekends toggle changes, keeping the
  // user's current vantage point.
  const initialMountRef = useRef(true);
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    const { year, month } = currentCenterRef.current;
    setMonths(buildMonthsAround(new Date(year, month, 1), displayWeekends));
    needsInitialScrollRef.current = true;
  }, [displayWeekends]);

  // React to external selectedDate changes (date picker, chevrons, URL edit).
  useEffect(() => {
    const key = dateKey(selectedDate);
    if (key === lastHandledSelectedKeyRef.current) return;
    lastHandledSelectedKeyRef.current = key;
    currentCenterRef.current = {
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth(),
    };
    const inRange = monthsRef.current.some(
      (b) =>
        b.year === selectedDate.getFullYear() &&
        b.month === selectedDate.getMonth(),
    );
    if (!inRange) {
      setMonths(buildMonthsAround(selectedDate, displayWeekends));
      needsInitialScrollRef.current = true;
      return;
    }
    scrollToDate(selectedDate);
  }, [selectedDate, displayWeekends, scrollToDate]);

  // Scroll-anchor compensation after month prepend/append. Runs synchronously
  // in useLayoutEffect so the browser never paints the jump.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when months swap (refs read inside)
  useLayoutEffect(() => {
    if (!pendingAdjustRef.current) return;
    const { key, viewportOffset } = pendingAdjustRef.current;
    pendingAdjustRef.current = null;
    const anchor = monthRefs.current.get(key);
    if (!anchor) return;
    isProgrammaticScrollRef.current = true;
    window.scrollTo({
      top: anchor.getBoundingClientRect().top + window.scrollY - viewportOffset,
    });
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
  }, [months]);

  // Initial scroll to selectedDate (deferred via rAF so it runs after all
  // sibling/parent effects and layout).
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when months swap (refs read inside)
  useEffect(() => {
    if (!needsInitialScrollRef.current) return;
    const id = requestAnimationFrame(() => {
      if (scrollToDate(selectedDate)) needsInitialScrollRef.current = false;
    });
    return () => cancelAnimationFrame(id);
  }, [months, selectedDate, scrollToDate]);

  // Re-anchor to selectedDate the moment loading finishes. Data-hydrated
  // meetings expand cell heights, which would otherwise shift the viewport
  // and make reportVisibleMonth misdetect the visible month.
  const prevIsLoadingRef = useRef(isLoading);
  useLayoutEffect(() => {
    const wasLoading = prevIsLoadingRef.current;
    prevIsLoadingRef.current = isLoading;
    if (wasLoading && !isLoading) scrollToDate(selectedDate);
  }, [isLoading, selectedDate, scrollToDate]);

  const reportVisibleMonth = useCallback(() => {
    const stickyOffset =
      dayHeaderRef.current?.getBoundingClientRect().bottom ?? 0;
    const probe = window.scrollY + stickyOffset + 1;

    let bestBlock: MonthBlock | null = null;
    let bestTop = Number.NEGATIVE_INFINITY;
    for (const block of months) {
      const el = monthRefs.current.get(blockKey(block));
      if (!el) continue;
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top <= probe && top > bestTop) {
        bestBlock = block;
        bestTop = top;
      }
    }
    if (!bestBlock) return;

    const { year, month } = currentCenterRef.current;
    if (bestBlock.year === year && bestBlock.month === month) return;

    const firstOfMonth = new Date(bestBlock.year, bestBlock.month, 1);
    currentCenterRef.current = {
      year: bestBlock.year,
      month: bestBlock.month,
    };
    // Seed the selected-key with first-of-month so the parent's debounced
    // URL sync (which writes first-of-month back) is recognized as our own
    // echo and doesn't yank scroll.
    lastHandledSelectedKeyRef.current = dateKey(firstOfMonth);
    setVisibleMonth(firstOfMonth);
  }, [months, setVisibleMonth]);

  const appendNextMonth = useCallback(() => {
    // Snapshot each block's current viewport offset so we can pick an anchor
    // after the state update.
    const offsets = new Map<string, number>();
    for (const [k, el] of monthRefs.current) {
      offsets.set(k, el.getBoundingClientRect().top);
    }
    setMonths((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const next = [
        ...prev,
        buildMonth(last.year, last.month + 1, displayWeekends),
      ];
      const over = next.length - (MONTHS_BUFFER * 2 + 1);
      if (over > 0) {
        const anchorBlock = next[over];
        const viewportOffset = offsets.get(blockKey(anchorBlock));
        if (viewportOffset !== undefined) {
          pendingAdjustRef.current = {
            key: blockKey(anchorBlock),
            viewportOffset,
          };
        }
        return next.slice(over);
      }
      return next;
    });
  }, [displayWeekends]);

  const prependPrevMonth = useCallback(() => {
    const first = monthsRef.current[0];
    const anchorOffset = first
      ? monthRefs.current.get(blockKey(first))?.getBoundingClientRect().top
      : undefined;
    setMonths((prev) => {
      if (prev.length === 0) return prev;
      const firstBlock = prev[0];
      const next = [
        buildMonth(firstBlock.year, firstBlock.month - 1, displayWeekends),
        ...prev,
      ];
      if (anchorOffset !== undefined) {
        pendingAdjustRef.current = {
          key: blockKey(firstBlock),
          viewportOffset: anchorOffset,
        };
      }
      const over = next.length - (MONTHS_BUFFER * 2 + 1);
      return over > 0 ? next.slice(0, next.length - over) : next;
    });
  }, [displayWeekends]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    if (needsInitialScrollRef.current) return;

    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    if (scrollTop + clientHeight >= scrollHeight - SCROLL_EDGE_THRESHOLD) {
      appendNextMonth();
    } else if (scrollTop <= SCROLL_EDGE_THRESHOLD) {
      prependPrevMonth();
    }
    reportVisibleMonth();
  }, [appendNextMonth, prependPrevMonth, reportVisibleMonth]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const weekdays = displayWeekends
    ? WEEKDAYS_WITH_WEEKENDS
    : WEEKDAYS_WITHOUT_WEEKENDS;

  // Day popup for cells with more than 3 meetings.
  type PopupState = { meetings: Moetemappe[]; date: Date } | null;
  const [popup, setPopup] = useState<PopupState>(null);
  const popupTriggerRef = useRef<HTMLElement | null>(null);

  // Lock page scroll while the popup is open. Target <html> because the
  // global stylesheet sets `overflow-y: scroll` on <html>, not <body>.
  useEffect(() => {
    document.documentElement.style.overflowY = popup ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflowY = '';
    };
  }, [popup]);

  return (
    <div
      className={cn(
        styles.dynamicCalendarWrapper,
        displayWeekends ? styles.withWeekends : styles.noWeekends,
      )}
    >
      <div ref={dayHeaderRef} className={styles.dynCalendarHeader}>
        {weekdays.map((d) => (
          <div key={d} className={styles.dayHeaderCell}>
            <span className={styles.dayHeaderText}>
              {t(`calendar.days.${d}`)}
            </span>
          </div>
        ))}
      </div>

      {popup !== null &&
        typeof document !== 'undefined' &&
        createPortal(
          // A position:fixed wrapper so EinPopup's anchor math finds a
          // positioned ancestor; zIndex ensures it renders above the grid.
          <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
            <EinPopup
              open={true}
              setOpen={(open) => {
                if (!open) setPopup(null);
              }}
              triggerRef={popupTriggerRef}
              animate
              className={styles.popup}
            >
              <div className={styles.dayPopupHeader}>
                <Heading level={2} data-size="sm">
                  {t(`calendar.days.${popup.date.getDay()}`)}{' '}
                  {popup.date.getDate()}{' '}
                  {t(`calendar.months.${popup.date.getMonth()}`)}
                </Heading>
                <Button
                  icon
                  variant="tertiary"
                  data-color="neutral"
                  data-size="sm"
                  aria-label={t('site:closeModal')}
                  onClick={() => setPopup(null)}
                >
                  <XMarkIcon />
                </Button>
              </div>
              <div className={styles.dayPopupBody}>
                {popup.meetings.map((item) => (
                  <MoetemappeModule
                    key={item.id}
                    item={item}
                    variant="expanded"
                  />
                ))}
              </div>
            </EinPopup>
          </div>,
          document.body,
        )}

      {months.map((block) => {
        const key = blockKey(block);
        const monthLoaded = loadedMonths.has(key);
        return (
          <div
            key={key}
            ref={(el) => {
              if (el) monthRefs.current.set(key, el);
              else monthRefs.current.delete(key);
            }}
            className={styles.monthBlock}
          >
            <div className={styles.monthHeading}>
              <Heading level={2} data-size="sm">
                {t(`calendar.months.${block.month}`)} {block.year}
              </Heading>
            </div>

            <div className={styles.calendarGrid}>
              {block.weeks.map((week) => (
                <div key={dateKey(week[0].date)} className={styles.weekRow}>
                  {week.map((cell) => {
                    if (!cell.inMonth) {
                      return (
                        <div
                          key={dateKey(cell.date)}
                          className={cn(styles.dayCell, styles.emptyCell)}
                          aria-hidden="true"
                        />
                      );
                    }
                    const dayMeetings =
                      meetingsByDay.get(cell.date.toDateString()) ?? [];
                    const extraCount = Math.max(0, dayMeetings.length - 3);
                    return (
                      <div
                        key={dateKey(cell.date)}
                        data-day={cell.date.getDate()}
                        className={cn(
                          styles.dayCell,
                          cell.isToday ? styles.today : undefined,
                        )}
                      >
                        <div>
                          {cell.isToday ? (
                            <Badge
                              className={styles.dateText}
                              count={cell.date.getDate()}
                            />
                          ) : (
                            <span className={styles.dateText}>
                              {cell.date.getDate()}
                            </span>
                          )}
                        </div>

                        <div className={styles.meetingList}>
                          {isLoading && !monthLoaded ? (
                            <>
                              <MoetemappeSkeleton />
                              <MoetemappeSkeleton />
                            </>
                          ) : (
                            <>
                              {dayMeetings.slice(0, 3).map((item) => (
                                <MoetemappeModule key={item.id} item={item} />
                              ))}
                              {extraCount > 0 && (
                                <EinButton
                                  className={styles.moreMeetingsButton}
                                  variant="secondary"
                                  color="neutral"
                                  data-size="sm"
                                  fullWidth={true}
                                  aria-label={t(
                                    'calendar.moreMeetings',
                                    String(extraCount),
                                  )}
                                  onClick={(e) => {
                                    popupTriggerRef.current = e.currentTarget;
                                    setPopup({
                                      meetings: dayMeetings,
                                      date: cell.date,
                                    });
                                  }}
                                >
                                  +{extraCount}
                                </EinButton>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
