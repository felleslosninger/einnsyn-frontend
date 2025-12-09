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
    const max_weeks = 20;
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

        if (container.scrollTop + container.clientHeight >= container.scrollHeight - threshold) {
            const lastWeek = weeks[weeks.length - 1];
            const lastDay = lastWeek[lastWeek.length - 1].date;

            setWeeks((prev) => [...prev, generateNextWeek(lastDay)]);
        }

        if (container.scrollTop <= threshold) {
            const firstWeek = weeks[0];
            const firstDay = firstWeek[0].date;

            const prevHeight = container.scrollHeight;

            setWeeks((prev) => [generatePreviousWeek(firstDay), ...prev]);

            requestAnimationFrame(() => {
                const newHeight = container.scrollHeight;
                const diff = newHeight - prevHeight;
                container.scrollTop = diff + container.scrollTop;
            });
        }
    }, [weeks, generateNextWeek, generatePreviousWeek]);

    useEffect(() => {
        const container = scrollRef.current;
        if (container) {
            console.log('Container height:', container.clientHeight);
            console.log('Scroll height:', container.scrollHeight);
            console.log('Can scroll:', container.scrollHeight > container.clientHeight);
        }
    }, []);

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