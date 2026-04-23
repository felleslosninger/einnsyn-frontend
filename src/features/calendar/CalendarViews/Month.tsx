import { Heading } from '@digdir/designsystemet-react';
import type { Moetemappe } from '@digdir/einnsyn-sdk';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from '../CalendarContainer.module.scss';
import MoetemappeModule from '../Moetemappe';
import { MoetemappeSkeleton } from '../MoetemappeSkeleton';
import { EinButton } from '~/components/EinButton/EinButton';

const MONTHS_BUFFER = 4; // keep 2 * buffer + 1 = 9 months rendered
const SCROLL_EDGE_THRESHOLD = 400;

const WEEKDAYS_WITH_WEEKENDS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;
const WEEKDAYS_WITHOUT_WEEKENDS = WEEKDAYS_WITH_WEEKENDS.slice(0, 5);

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
}: {
  isLoading: boolean;
  selectedDate: Date;
  displayWeekends: boolean;
  currentCalendarResults: Moetemappe[];
  setVisibleMonth: (date: Date) => void;
}) {
  const t = useTranslation();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dayHeaderRef = useRef<HTMLDivElement | null>(null);
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingAdjustRef = useRef<{
    key: string;
    viewportOffset: number;
  } | null>(null);
  const needsInitialScrollRef = useRef(true);
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
  // including `months` in their dependency lists (which would re-run them on
  // every scroll-driven setMonths and wrongly re-trigger initial-scroll logic).
  const monthsRef = useRef(months);
  monthsRef.current = months;

  const scrollToDate = useCallback((date: Date) => {
    const container = scrollRef.current;
    if (!container) return false;
    const key = blockKey({
      year: date.getFullYear(),
      month: date.getMonth(),
    });
    const block = monthRefs.current.get(key);
    if (!block) return false;
    const stickyOffset = dayHeaderRef.current?.offsetHeight ?? 0;
    const dayEl = block.querySelector<HTMLElement>(
      `[data-day="${date.getDate()}"]`,
    );
    container.scrollTop = (dayEl ?? block).offsetTop - stickyOffset;
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
  // We don't write to selectedDate from scroll anymore, so any change here is
  // genuinely external and warrants a scroll/rebuild.
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

  // Apply pending scroll anchor adjustment after virtualization swap, or
  // perform initial scroll to selectedDate if flagged.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when months swap (refs read inside)
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (pendingAdjustRef.current) {
      const { key, viewportOffset } = pendingAdjustRef.current;
      pendingAdjustRef.current = null;
      const anchor = monthRefs.current.get(key);
      if (anchor) {
        container.scrollTop = anchor.offsetTop - viewportOffset;
      }
      return;
    }

    if (needsInitialScrollRef.current) {
      if (scrollToDate(selectedDate)) {
        needsInitialScrollRef.current = false;
      }
    }
  }, [months, selectedDate, scrollToDate]);

  const reportVisibleMonth = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const stickyOffset = dayHeaderRef.current?.offsetHeight ?? 0;
    const probe = container.scrollTop + stickyOffset + 1;

    let bestBlock: MonthBlock | null = null;
    let bestTop = Number.NEGATIVE_INFINITY;
    for (const block of months) {
      const el = monthRefs.current.get(blockKey(block));
      if (!el) continue;
      const top = el.offsetTop;
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
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    // Near bottom → append next month, trim from top if over buffer
    if (scrollTop + clientHeight >= scrollHeight - SCROLL_EDGE_THRESHOLD) {
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
          const anchorEl = monthRefs.current.get(blockKey(anchorBlock));
          if (anchorEl) {
            pendingAdjustRef.current = {
              key: blockKey(anchorBlock),
              viewportOffset: anchorEl.offsetTop - container.scrollTop,
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
      setMonths((prev) => {
        if (prev.length === 0) return prev;
        const first = prev[0];
        const next = [
          buildMonth(first.year, first.month - 1, displayWeekends),
          ...prev,
        ];
        const anchorEl = monthRefs.current.get(blockKey(first));
        if (anchorEl) {
          pendingAdjustRef.current = {
            key: blockKey(first),
            viewportOffset: anchorEl.offsetTop - container.scrollTop,
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

  const weekdays = displayWeekends
    ? WEEKDAYS_WITH_WEEKENDS
    : WEEKDAYS_WITHOUT_WEEKENDS;

  return (
    <div
      ref={scrollRef}
      className={cn(
        styles.dynamicCalendarWrapper,
        displayWeekends ? styles.withWeekends : styles.noWeekends,
      )}
      onScroll={handleScroll}
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

      {months.map((block) => {
        const key = blockKey(block);
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
              <Heading level={2} data-size="md">
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
                    const dayHasCache = dayMeetings.length > 0;
                    return (
                      <div
                        key={dateIsoKey(cell.date)}
                        data-day={cell.date.getDate()}
                        className={cn(
                          styles.dayCell,
                          styles.currentMonth,
                          cell.isToday ? styles.today : '',
                        )}
                      >
                        <div className={styles.dateHeader}>
                          <span className={styles.dateText}>
                            {cell.date.getDate()}
                          </span>
                        </div>

                        <div className={styles.meetingList}>
                          {isLoading && !dayHasCache ? (
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
                                  onClick={() => {}}
                                  data-size="sm"
                                  fullWidth={true}
                                  aria-label={t(
                                    `calendar.more_meetings_${dayMeetings.length - 3}`,
                                  )}
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
