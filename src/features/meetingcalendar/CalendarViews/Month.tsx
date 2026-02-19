/** biome-ignore-all lint/suspicious/noExplicitAny: ignore temp.*/
import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from '../CalendarContainer.module.scss';
import type { CalendarView } from '../calendarHelpers';
import MoetemappeModule from '../Moetemappe';
import { MeetingSkeleton } from '../Moetemappe';
import { Heading } from '@digdir/designsystemet-react';

const WEEK_HEIGHT = 305;
const MAX_WEEKS = 8;

export default function DynamicView({
  isLoading,
  selectedDate,
  displayWeekends,
  currentCalendarResults,
  setSelectedView,
  setSelectedDate,
}: {
  isLoading: boolean;
  selectedDate: Date;
  displayWeekends: boolean;
  currentCalendarResults: Moetemappe[];
  setSelectedView: (view: CalendarView) => void;
  setSelectedDate: (date: Date) => void;
}) {
  const t = useTranslation();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastReportedDateRef = useRef(selectedDate);

  const daysPerWeek = displayWeekends ? 7 : 5;

  // INITIAL GRID
  const initialGrid = useMemo(() => {
    const weeksArr = [];

    const start = new Date(selectedDate);
    const dayOfWeek = start.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    start.setDate(start.getDate() + daysToMonday); // move to monday
    start.setDate(start.getDate() - 2 * 7);

    const cursor = new Date(start);

    for (let week = 0; week < MAX_WEEKS; week++) {
      const days = [];
      for (let day = 0; day < daysPerWeek; day++) {
        const isCurrentMonth = cursor.getMonth() === selectedDate.getMonth();
        const isToday = cursor.toDateString() === new Date().toDateString();

        days.push({
          date: new Date(cursor),
          dayNumber: cursor.getDate(),
          isCurrentMonth,
          isToday,
        });

        cursor.setDate(cursor.getDate() + 1);
      }

      if (!displayWeekends) {
        cursor.setDate(cursor.getDate() + 2);
      }
      weeksArr.push(days);
    }
    return weeksArr;
  }, [selectedDate, displayWeekends, daysPerWeek]);

  // STATE
  const [weeks, setWeeks] = useState(initialGrid);

  useEffect(() => {
    setWeeks(initialGrid);
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 2 * WEEK_HEIGHT;
      }
    });
  }, [initialGrid]);

  const generateNextWeek = useCallback(
    (lastDate: Date) => {
      const newWeek: any[] = [];
      const cursor = new Date(lastDate);

      cursor.setDate(cursor.getDate() + 1);
      for (let day = 0; day < daysPerWeek; day++) {
        newWeek.push({
          date: new Date(cursor),
          isCurrentMonth: cursor.getMonth() === selectedDate.getMonth(),
          isToday: cursor.toDateString() === new Date().toDateString(),
          dayNumber: cursor.getDate(),
        });
        cursor.setDate(cursor.getDate() + 1);
      }

      if (!displayWeekends) {
        cursor.setDate(cursor.getDate() + 2);
      }

      return newWeek;
    },
    [daysPerWeek, displayWeekends, selectedDate],
  );

  const generatePreviousWeek = useCallback(
    (firstDate: Date) => {
      const newWeek: any[] = [];
      const cursor = new Date(firstDate);

      cursor.setDate(
        cursor.getDate() - (daysPerWeek + (displayWeekends ? 0 : 2)),
      );

      for (let day = 0; day < daysPerWeek; day++) {
        newWeek.push({
          date: new Date(cursor),
          isCurrentMonth: cursor.getMonth() === selectedDate.getMonth(),
          isToday: cursor.toDateString() === new Date().toDateString(),
          dayNumber: cursor.getDate(),
        });
        cursor.setDate(cursor.getDate() + 1);
      }

      return newWeek;
    },
    [daysPerWeek, displayWeekends, selectedDate],
  );

  //SCROLL HANDLER
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const threshold = 100;
    const scrollTop = container.scrollTop;

    // Load more weeks when scrolling down
    if (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - threshold
    ) {
      const lastWeek = weeks[weeks.length - 1];
      const lastDay = lastWeek[lastWeek.length - 1].date;

      setWeeks((prev) => {
        const newWeeks = [...prev, generateNextWeek(lastDay)];

        // Remove old weeks from the top if exceeding max
        if (newWeeks.length > MAX_WEEKS) {
          const removeCount = newWeeks.length - MAX_WEEKS;
          if (removeCount > 0) {
            const removed = newWeeks.splice(0, removeCount);
            // Adjust scroll position to compensate for removed weeks
            requestAnimationFrame(() => {
              if (container) {
                container.scrollTop = scrollTop - removed.length * WEEK_HEIGHT;
              }
            });
          }
        }

        return newWeeks;
      });
    }

    // Load more weeks when scrolling up
    if (container.scrollTop <= threshold) {
      setWeeks((prev) => {
        const firstWeek = prev[0];
        const firstDay = firstWeek[0].date;

        const newWeeks = [generatePreviousWeek(firstDay), ...prev];

        // Remove old weeks from the bottom if exceeding max
        if (newWeeks.length > MAX_WEEKS) {
          const removeCount = newWeeks.length - MAX_WEEKS;

          if (removeCount > 0) {
            newWeeks.splice(-removeCount);
          }
        }

        return newWeeks;
      });
    }
  }, [weeks, generateNextWeek, generatePreviousWeek]);

  //TODO: If a date is displayed that is not in date range, update date range. SetSelectedDate should be first day displayed
  const updateSelectedDateOnScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const visibleWeekIndex = Math.floor(scrollTop / WEEK_HEIGHT);

    if (visibleWeekIndex >= 0 && visibleWeekIndex < weeks.length) {
      const visibleWeek = weeks[visibleWeekIndex];
      const newDate = visibleWeek[0].date;

      // Update selected date only if the week has changed
      const currentWeekIndex = weeks.findIndex((week) =>
        week.some(
          (day) =>
            day.date.toDateString() ===
            lastReportedDateRef.current.toDateString(),
        ),
      );

      if (currentWeekIndex !== visibleWeekIndex) {
        lastReportedDateRef.current = newDate;
        setSelectedDate(new Date(newDate));
      }
    }
  }, [weeks, setSelectedDate]);

  // Add after the handleScroll function
  const handleScrollEnd = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const nearestWeekTop = Math.round(scrollTop / WEEK_HEIGHT) * WEEK_HEIGHT;

    container.scrollTo({
      top: nearestWeekTop,
      behavior: 'smooth',
    });

    updateSelectedDateOnScroll();
  }, [updateSelectedDateOnScroll]);

  // Add debounced scroll end detection
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const onScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScrollEnd, 150);
    };

    container.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      clearTimeout(scrollTimeout);
      container.removeEventListener('scroll', onScroll);
    };
  }, [handleScrollEnd]);

  return (
    <div
      ref={scrollRef}
      className={cn(styles.dynamicCalendarWrapper)}
      onScroll={handleScroll}
    >
      <div
        className={cn(
          styles.calendarGrid,
          displayWeekends ? styles.withWeekends : styles.noWeekends,
        )}
      >
        <div className={styles.dynCalendarHeader}>
          {weeks[0].map((day) => (
            <div key={day.date.toISOString()} className={styles.dayHeaderCell}>
              <span className={styles.dayHeaderText}>
                {t(
                  `meetingcalendar.days.${day.date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()}`,
                )}
              </span>
            </div>
          ))}
        </div>
        {weeks.map((week) => (
          <div
            key={week[0].date.toISOString()}
            className={cn(styles.weekRow, styles.dynWeekRow)}
          >
            {week.map((day) => {
              const dayMeetings = currentCalendarResults.filter(
                (item) =>
                  item.moetedato &&
                  new Date(item.moetedato).toDateString() ===
                    day.date.toDateString(),
              );

              return (
                <div
                  key={day.date.toISOString()}
                  className={cn(
                    styles.dayCell,
                    day.isCurrentMonth ? styles.currentMonth : '',
                    day.isToday ? styles.today : '',
                    day.date.getDate() === 1 ? styles.firstDay : '',
                  )}
                >
                  <div className={styles.dateHeader}>
                    {day.date.getDate() === 1 ? (
                      <Heading level={1} data-size="sm">
                        {day.date.getDate()}
                        {'. '}
                        {t(`meetingcalendar.months.${day.date.getMonth()}`)}
                      </Heading>
                    ) : (
                      <span className={styles.dateText}>
                        {day.date.getDate()}
                      </span>
                    )}
                  </div>

                  <div className={styles.meetingList}>
                    {isLoading ? (
                      // Render 1-2 skeletons per day to show activity
                      <>
                        <MeetingSkeleton />
                        {Math.random() > 0.5 && <MeetingSkeleton />}
                      </>
                    ) : (
                      dayMeetings.map((item) => (
                        <MoetemappeModule key={item.id} item={item} />
                      ))
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
}
