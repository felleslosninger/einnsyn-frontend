import { Badge, Button, Heading } from '@digdir/designsystemet-react';
import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { XMarkIcon } from '@navikt/aksel-icons';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
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

const MONTHS_BUFFER = 4; // keep 2 * buffer + 1 = 9 months rendered
const SCROLL_EDGE_THRESHOLD = 400;

const WEEKDAYS_WITH_WEEKENDS = [1, 2, 3, 4, 5, 6, 0] as const; // Mon–Sun (JS getDay order)
const WEEKDAYS_WITHOUT_WEEKENDS = [1, 2, 3, 4, 5] as const; // Mon–Fri

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

const toMondayCol = (date: Date) => {
  const dow = date.getDay();
  return dow === 0 ? 6 : dow - 1;
};

const dateIsoKey = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function buildMonth(
  year: number,
  month: number,
  displayWeekends: boolean,
): MonthBlock {
  // Normalize (handles month under/overflow like -1 or 12)
  const anchor = new Date(year, month, 1);
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const lastOfMonth = new Date(y, m + 1, 0);
  const todayStr = new Date().toDateString();

  // Start from the Monday of the week that contains day 1
  const startCol = toMondayCol(anchor);
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
}

function buildMonthsAround(
  center: Date,
  displayWeekends: boolean,
  buffer: number,
): MonthBlock[] {
  const blocks: MonthBlock[] = [];
  for (let offset = -buffer; offset <= buffer; offset++) {
    const d = new Date(center.getFullYear(), center.getMonth() + offset, 1);
    blocks.push(buildMonth(d.getFullYear(), d.getMonth(), displayWeekends));
  }
  return blocks;
}

export default function DynamicView({
  isLoading,
  selectedDate,
  displayWeekends,
  currentCalendarResults,
  setVisibleMonth,
  loadedMonths,
}: {
  isLoading: boolean;
  selectedDate: Date;
  displayWeekends: boolean;
  currentCalendarResults: Moetemappe[];
  setVisibleMonth: (date: Date) => void;
  loadedMonths: Set<string>;
}) {
  const t = useTranslation();
  const dayHeaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const update = () => {
      const h = document.querySelector('header')?.offsetHeight ?? 0;
      document.documentElement.style.setProperty(
        '--page-header-height',
        `${h}px`,
      );
    };
    update();
    const ro = new ResizeObserver(update);
    const headerEl = document.querySelector('header');
    if (headerEl) ro.observe(headerEl);
    return () => ro.disconnect();
  }, []);
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingAdjustRef = useRef<{
    key: string;
    viewportOffset: number;
  } | null>(null);
  const needsInitialScrollRef = useRef(true);
  // Prevent handleScroll from firing spuriously after a programmatic scrollTo.
  const isProgrammaticScrollRef = useRef(false);
  // Year-month we've most recently centered on. Used so the weekends-toggle
  // rebuild keeps the user's current vantage point, and so reportVisibleMonth
  // doesn't spam the parent with the same month each scroll tick.
  const currentCenterRef = useRef({
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth(),
  });
  const lastHandledSelectedKeyRef = useRef(dateIsoKey(selectedDate));

  const [cachedResults, setCachedResults] = useState<Moetemappe[]>(
    currentCalendarResults,
  );
  useEffect(() => {
    if (!isLoading) setCachedResults(currentCalendarResults);
  }, [isLoading, currentCalendarResults]);

  const [months, setMonths] = useState<MonthBlock[]>(() =>
    buildMonthsAround(selectedDate, displayWeekends, MONTHS_BUFFER),
  );

  // Mirror months into a ref so effects can read the latest value without
  // including `months` in their dependency lists
  const monthsRef = useRef(months);
  monthsRef.current = months;

  const scrollToDate = useCallback((date: Date) => {
    const key = blockKey({
      year: date.getFullYear(),
      month: date.getMonth(),
    });
    const block = monthRefs.current.get(key);
    if (!block) return false;
    // Use the day-header's rendered bottom as the sticky clearance — this
    // automatically accounts for the page header + calendar header above it.
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

  // Rebuild when weekends toggle changes
  const initialMountRef = useRef(true);
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    const { year, month } = currentCenterRef.current;
    setMonths(
      buildMonthsAround(
        new Date(year, month, 1),
        displayWeekends,
        MONTHS_BUFFER,
      ),
    );
    needsInitialScrollRef.current = true;
  }, [displayWeekends]);

  // React to external selectedDate changes (date picker, chevrons, URL edit).
  useEffect(() => {
    const key = dateIsoKey(selectedDate);
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
      setMonths(
        buildMonthsAround(selectedDate, displayWeekends, MONTHS_BUFFER),
      );
      needsInitialScrollRef.current = true;
      return;
    }
    scrollToDate(selectedDate);
  }, [selectedDate, displayWeekends, scrollToDate]);

  // Scroll anchor compensation after month prepend/append (must be synchronous
  // to avoid a visual jump before the browser paints).
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when months swap (refs read inside)
  useLayoutEffect(() => {
    if (!pendingAdjustRef.current) return;
    const { key, viewportOffset } = pendingAdjustRef.current;
    pendingAdjustRef.current = null;
    const anchor = monthRefs.current.get(key);
    if (anchor) {
      isProgrammaticScrollRef.current = true;
      window.scrollTo({
        top:
          anchor.getBoundingClientRect().top + window.scrollY - viewportOffset,
      });
      requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false;
      });
    }
  }, [months]);

  // Initial scroll to selectedDate — deferred via rAF so it runs after all
  // sibling/parent useEffects and the DOM has fully laid out.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when months swap (refs read inside)
  useEffect(() => {
    if (!needsInitialScrollRef.current) return;
    const id = requestAnimationFrame(() => {
      if (scrollToDate(selectedDate)) {
        needsInitialScrollRef.current = false;
      }
    });
    return () => cancelAnimationFrame(id);
  }, [months, selectedDate, scrollToDate]);

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
    // Seed the external-change key with first-of-month so the debounced
    // URL sync in the parent (which writes first-of-month back into
    // selectedDate) is recognized as our own echo and doesn't yank scroll.
    lastHandledSelectedKeyRef.current = dateIsoKey(firstOfMonth);
    setVisibleMonth(firstOfMonth);
  }, [months, setVisibleMonth]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;

    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    // Near bottom → append next month, trim from top if over buffer
    if (scrollTop + clientHeight >= scrollHeight - SCROLL_EDGE_THRESHOLD) {
      const anchorViewportOffsets = new Map<string, number>();
      for (const [k, el] of monthRefs.current) {
        anchorViewportOffsets.set(k, el.getBoundingClientRect().top);
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
          const viewportOffset = anchorViewportOffsets.get(
            blockKey(anchorBlock),
          );
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
      reportVisibleMonth();
      return;
    }

    // Near top → prepend previous month, trim from bottom if over buffer
    if (scrollTop <= SCROLL_EDGE_THRESHOLD) {
      const firstMonths = monthsRef.current;
      const first = firstMonths[0];
      const anchorViewportOffset = first
        ? monthRefs.current.get(blockKey(first))?.getBoundingClientRect().top
        : undefined;
      setMonths((prev) => {
        if (prev.length === 0) return prev;
        const firstBlock = prev[0];
        const next = [
          buildMonth(firstBlock.year, firstBlock.month - 1, displayWeekends),
          ...prev,
        ];
        if (anchorViewportOffset !== undefined) {
          pendingAdjustRef.current = {
            key: blockKey(firstBlock),
            viewportOffset: anchorViewportOffset,
          };
        }
        const over = next.length - (MONTHS_BUFFER * 2 + 1);
        return over > 0 ? next.slice(0, next.length - over) : next;
      });
      reportVisibleMonth();
      return;
    }

    reportVisibleMonth();
  }, [displayWeekends, reportVisibleMonth]);

  // Attach scroll listener to the window (page-level scroll).
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const weekdays = displayWeekends
    ? WEEKDAYS_WITH_WEEKENDS
    : WEEKDAYS_WITHOUT_WEEKENDS;

  type PopupState = { meetings: Moetemappe[]; date: Date } | null;
  const [popup, setPopup] = useState<PopupState>(null);
  const popupTriggerRef = useRef<HTMLElement | null>(null);

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
          // position:fixed wrapper so EinPopup's anchor math works correctly
          // with page-level scroll (getClosestPositionedAncestor finds this).
          // zIndex:9999 ensures it renders above all calendar grid stacking contexts.
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
                <div
                  key={dateIsoKey(week[0].date)}
                  className={cn(styles.weekRow, styles.dynWeekRow)}
                >
                  {week.map((cell) => {
                    if (!cell.inMonth) {
                      return (
                        <div
                          key={dateIsoKey(cell.date)}
                          className={cn(styles.dayCell, styles.emptyCell)}
                          aria-hidden="true"
                        />
                      );
                    }
                    const dayMeetings = cachedResults.filter(
                      (item) =>
                        item.moetedato &&
                        new Date(item.moetedato).toDateString() ===
                          cell.date.toDateString(),
                    );
                    return (
                      <div
                        key={dateIsoKey(cell.date)}
                        data-day={cell.date.getDate()}
                        className={cn(
                          styles.dayCell,
                          cell.isToday ? styles.today : '',
                        )}
                      >
                        <div>
                          {cell.isToday ? (
                            <Badge
                              className={cn(styles.dateText, styles.today)}
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
                              {Math.random() > 0.5 && <MoetemappeSkeleton />}
                            </>
                          ) : (
                            <>
                              {dayMeetings.slice(0, 3).map((item) => (
                                <MoetemappeModule key={item.id} item={item} />
                              ))}
                              {dayMeetings.length > 3 && (
                                <EinButton
                                  className={styles.moreMeetingsButton}
                                  variant="secondary"
                                  color="neutral"
                                  data-size="sm"
                                  fullWidth={true}
                                  aria-label={t(
                                    `calendar.more_meetings_${dayMeetings.length - 3}`,
                                  )}
                                  onClick={(e) => {
                                    popupTriggerRef.current = e.currentTarget;
                                    setPopup({
                                      meetings: dayMeetings,
                                      date: cell.date,
                                    });
                                  }}
                                >
                                  +{dayMeetings.length - 3}
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
