/** biome-ignore-all lint/suspicious/noExplicitAny: ignore temp.*/
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';

import styles from '../CalendarContainer.module.scss';

import type { PaginatedList, Base } from '@digdir/einnsyn-sdk';
import { isMoetemappe } from '@digdir/einnsyn-sdk';
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { startOfWeek } from '~/lib/utils/getStartOfWeek';
import { sortMeetingsByTime } from '../CalendarContainer';
import MoetemappeModule from '../Moetemappe';

export default function DynamicView({
    selectedDate,
    displayWeekends,
    currentSearchResults
}: {
    selectedDate: Date;
    displayWeekends: boolean;
    currentSearchResults: PaginatedList<Base>;
}) {
    const t = useTranslation();

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const daysPerWeek = displayWeekends ? 7 : 5;
    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const startDate = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const max_weeks = 12;
    const buffer_weeks = 3;
    startDate.setDate(firstDayOfMonth.getDate() - daysToSubtract);

    // INITIAL GRID 
    const initialGrid = useMemo(() => {
        const firstWeekStart = startOfWeek(selectedDate);
        const container = scrollRef.current;
        const weeksToShow = container?.clientHeight ? Math.ceil(container.clientHeight / 250) : 6;

        const current = new Date(firstWeekStart);
        const weeks = [];

        for (let week = 0; week < weeksToShow; week++) {
            const days = [];

            for (let day = 0; day < daysPerWeek; day++) {
                const isCurrentMonth = current.getMonth() === selectedDate.getMonth();
                const isToday = current.toDateString() === new Date().toDateString();

                days.push({
                    date: new Date(current),
                    dayNumber: current.getDate(),
                    isCurrentMonth,
                    isToday
                })

                current.setDate(current.getDate() + 1);

            }

            if (!displayWeekends) {
                current.setDate(current.getDate() + 2);
            }

            weeks.push(days);
        }

        return weeks;
    }, [selectedDate, displayWeekends, daysPerWeek]);

    // STATE
    const [weeks, setWeeks] = useState(initialGrid);

    useEffect(() => {
        setWeeks(initialGrid);
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.clientHeight;
        }
    }, [initialGrid]);

    const generateNextWeek = useCallback((lastDate: Date) => {
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
    }, [daysPerWeek, displayWeekends, selectedDate]);

    const generatePreviousWeek = useCallback((firstDate: Date) => {
        const newWeek: any[] = [];
        const cursor = new Date(firstDate);

        cursor.setDate(cursor.getDate() - (daysPerWeek + (displayWeekends ? 0 : 2)));

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
    }, [daysPerWeek, displayWeekends, selectedDate]);


    //SCROLL HANDLER
    const handleScroll = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;

        const threshold = 100;
        const weekHeight = 250; // Approximate height of a week row
        const scrollTop = container.scrollTop;
        const visibleWeekIndex = Math.floor(scrollTop / weekHeight);

        // Load more weeks when scrolling down
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - threshold) {
            const lastWeek = weeks[weeks.length - 1];
            const lastDay = lastWeek[lastWeek.length - 1].date;

            setWeeks((prev) => {
                const newWeeks = [...prev, generateNextWeek(lastDay)];

                // Remove old weeks from the top if exceeding max
                if (newWeeks.length > max_weeks) {
                    const removeCount = visibleWeekIndex - buffer_weeks;
                    if (removeCount > 0) {
                        const removed = newWeeks.splice(0, removeCount);
                        console.log('Removed weeks from top:', removed.length); //TODO: remove temp log
                        // Adjust scroll position to compensate for removed weeks
                        requestAnimationFrame(() => {
                            if (container) {
                                container.scrollTop = scrollTop - (removed.length * weekHeight);
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
                const prevScrollHeight = container.scrollHeight;

                const newWeeks = [generatePreviousWeek(firstDay), ...prev];

                // Remove old weeks from the bottom if exceeding max
                if (newWeeks.length > max_weeks) {
                    // Calculate how many weeks from the end we should remove
                    const totalWeeks = newWeeks.length;
                    const keepUntilIndex = visibleWeekIndex + buffer_weeks + 1; // +1 because we just added one at top
                    const removeCount = totalWeeks - keepUntilIndex;

                    if (removeCount > 0) {
                        newWeeks.splice(-removeCount);
                        console.log('Removing weeks from bottom:', removeCount);
                    }
                }

                // Adjust scroll position after adding week at top
                requestAnimationFrame(() => {
                    if (container) {
                        const newScrollHeight = container.scrollHeight;
                        const heightDiff = newScrollHeight - prevScrollHeight;
                        container.scrollTop = scrollTop + heightDiff;
                    }
                });

                return newWeeks;
            });

            requestAnimationFrame(() => {
                const newHeight = container.scrollHeight;
                const diff = newHeight;
                container.scrollTop = diff + container.scrollTop;
            });
        }
    }, [weeks, generateNextWeek, generatePreviousWeek]);

    return (
        <div ref={scrollRef} className={cn(styles.dynamicCalendarWrapper)} onScroll={handleScroll}>
            <div
                className={cn(
                    styles.calendarGrid,
                    displayWeekends ? styles.withWeekends : styles.noWeekends
                )}
            >
                <div className={styles.dynCalendarHeader}>
                    {weeks[0].map((day) => (
                        <div key={day.date.toISOString()} className={styles.dayHeaderCell}>
                            <span className={styles.dayHeaderText}>
                                {t(`moetekalender.days.${day.date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()}`)}
                            </span>
                        </div>
                    ))}
                </div>
                {weeks.map((week, weekIndex) => (
                    <div key={`week-${weekIndex}`} className={styles.weekRow}>
                        {week.map((day) => (
                            <div
                                key={day.date.toISOString()}
                                className={cn(
                                    styles.dayCell,
                                    !day.isCurrentMonth ? styles.otherMonth : '',
                                    day.isToday ? styles.today : '')}
                            >
                                <span className={styles.dateText}>
                                    {day.date.getDate()}
                                    {day.date.getDate() === 1 && (
                                        <> {t(`moetekalender.months.${day.date.getMonth()}`)}</>
                                    )}
                                </span>

                                {sortMeetingsByTime(
                                    currentSearchResults.items.filter((item) =>
                                        isMoetemappe(item) &&
                                        new Date(item.moetedato).toDateString() === day.date.toDateString()
                                    )
                                ).map((item) =>
                                    isMoetemappe(item) ? <MoetemappeModule key={item.id} item={item} /> : null
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

//TODOLIST:
// - Show weeknumber?
// - Autoconfigure number of weeks based on container height
// - Improve performance by removing offscreen weeks
// - Better styling of meeting modules
// - Update daterange when scrolling (without unnecessary re-renders)
// - Snap to week on scroll
// - Fix upward scrolling jump