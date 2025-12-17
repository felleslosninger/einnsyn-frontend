/** biome-ignore-all lint/suspicious/noExplicitAny: ignore temp.*/
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';

import styles from '../CalendarContainer.module.scss';

import type { PaginatedList, Base } from '@digdir/einnsyn-sdk';
import { isMoetemappe } from '@digdir/einnsyn-sdk';
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { sortMeetingsByTime } from '../CalendarContainer';
import MoetemappeModule from '../Moetemappe';

export default function DynamicView({
    selectedDate,
    displayWeekends,
    currentSearchResults,
    setSelectedDate
}: {
    selectedDate: Date;
    displayWeekends: boolean;
    currentSearchResults: PaginatedList<Base>;
    setSelectedDate: (date: Date) => void;
}) {
    const t = useTranslation();

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const daysPerWeek = displayWeekends ? 7 : 5;
    const max_weeks = 12;
    const weekHeight = 300;
    const lastReportedDateRef = useRef(selectedDate);

    // INITIAL GRID 
    const initialGrid = useMemo(() => {
        const weeksArr = [];

        const start = new Date(selectedDate);
        const dayOfWeek = start.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        start.setDate(start.getDate() + daysToMonday); // move to monday
        start.setDate(start.getDate() - 4 * 7); // 4 weeks back

        const cursor = new Date(start);

        for (let week = -4; week < 4; week++) {
            const days = [];
            for (let day = 0; day < daysPerWeek; day++) {
                const isCurrentMonth = cursor.getMonth() === selectedDate.getMonth();
                const isToday = cursor.toDateString() === new Date().toDateString();

                days.push({
                    date: new Date(cursor),
                    dayNumber: cursor.getDate(),
                    isCurrentMonth,
                    isToday
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
                scrollRef.current.scrollTop = 4 * weekHeight;
            }
        });
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
        const scrollTop = container.scrollTop;

        // Load more weeks when scrolling down
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - threshold) {
            const lastWeek = weeks[weeks.length - 1];
            const lastDay = lastWeek[lastWeek.length - 1].date;

            setWeeks((prev) => {
                const newWeeks = [...prev, generateNextWeek(lastDay)];

                // Remove old weeks from the top if exceeding max
                if (newWeeks.length > max_weeks) {
                    const removeCount = newWeeks.length - max_weeks;
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

                const newWeeks = [generatePreviousWeek(firstDay), ...prev];

                // Remove old weeks from the bottom if exceeding max
                if (newWeeks.length > max_weeks) {
                    const removeCount = newWeeks.length - max_weeks;

                    if (removeCount > 0) {
                        newWeeks.splice(-removeCount);
                        console.log('Removing weeks from bottom:', removeCount);
                    }
                }

                // Adjust scroll position after adding week at top
                // requestAnimationFrame(() => {
                //     if (container) {
                //         const newScrollHeight = container.scrollHeight;
                //         const heightDiff = newScrollHeight - prevScrollHeight;
                //         container.scrollTop = scrollTop + heightDiff;
                //     }
                // });

                return newWeeks;
            });
        }
    }, [weeks, generateNextWeek, generatePreviousWeek]);

    //TODO: If a date is displayed that is not in date range, update date range. SetSelectedDate should be first day displayed
    const updateSelectedDateOnScroll = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;

        const scrollTop = container.scrollTop;
        const visibleWeekIndex = Math.floor(scrollTop / weekHeight);

        if (visibleWeekIndex >= 0 && visibleWeekIndex < weeks.length) {
            const visibleWeek = weeks[visibleWeekIndex];
            const newDate = visibleWeek[0].date;

            if (lastReportedDateRef.current.toDateString() !== newDate.toDateString()) {
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
        const nearestWeekTop = Math.round(scrollTop / weekHeight) * weekHeight;

        container.scrollTo({
            top: nearestWeekTop,
            behavior: 'smooth'
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
                {weeks.map((week) => (
                    <div key={week[0].date.toISOString()} className={styles.weekRow}>
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
// - Autoconfigure number of weeks based on container height (and weekheight?)
// - Use einTransition? for scroll handler?
// - make daterange the same as weekArr? 

// - Fix visual glitches 

// on scroll, set selected date to first visible date (not hidden) and update date range accordingly. And bounce back to nearest week top