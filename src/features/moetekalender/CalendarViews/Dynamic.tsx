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

    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const startDate = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDayOfMonth.getDate() - daysToSubtract);

    // --- Generate a 3-week grid starting from the week of selectedDate ---

    const calendarGrid = useMemo(() => {
        const firstWeekStart = startOfWeek(selectedDate);
        const daysPerWeek = displayWeekends ? 7 : 5;
        const weeksToShow = 3; //TODO: autoconfigure based on container height?
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
    }, [selectedDate, displayWeekends]);

    return (
        <div className={styles.dynamicCalendarWrapper}>
            <div
                className={cn(
                    styles.calendarGrid,
                    displayWeekends ? styles.withWeekends : styles.noWeekends
                )}
            >
                <div className={styles.dynCalendarHeader}>
                    {calendarGrid[0].map((day) => (
                        <div key={day.date.toISOString()} className={styles.dayHeaderCell}>
                            <span className={styles.dayHeaderText}>
                                {t(`moetekalender.days.${day.date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()}`)}
                            </span>
                        </div>
                    ))}
                </div>
                {calendarGrid.map((week, weekIndex) => (
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