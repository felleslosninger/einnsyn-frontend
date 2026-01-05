'use client';
import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';

import DayView from './CalendarViews/Day';
import MonthView from './CalendarViews/Month';
import WeekView from './CalendarViews/Week';
import Dynamic from './CalendarViews/Dynamic';

interface CalendarBodyProps {
    selectedView: string;
    selectedDate: Date;
    displayWeekends: boolean;
    currentSearchResults: PaginatedList<Base>;
    setSelectedDate: (date: Date) => void;
}

export default function CalendarBody({ selectedView, selectedDate, displayWeekends, currentSearchResults, setSelectedDate }: CalendarBodyProps) {

    return (
        <div
            className={cn(
                styles.calendarBody,
                selectedView === 'month' ? styles.monthView :
                    selectedView === 'week' ? styles.weekView :
                        selectedView === 'day' ? styles.dayView :
                            styles.dynamicView
            )}>
            {selectedView === 'month' && (
                <MonthView selectedDate={selectedDate} displayWeekends={displayWeekends} currentSearchResults={currentSearchResults} />
            )}
            {selectedView === 'week' && (
                <WeekView selectedDate={selectedDate} displayWeekends={displayWeekends} currentSearchResults={currentSearchResults} />
            )}
            {selectedView === 'day' && (
                <DayView selectedDate={selectedDate} currentSearchResults={currentSearchResults} />
            )}
            {selectedView === 'dynamic' && (
                <Dynamic selectedDate={selectedDate} displayWeekends={displayWeekends} currentSearchResults={currentSearchResults} setSelectedDate={setSelectedDate} />
            )}
        </div>
    );
}