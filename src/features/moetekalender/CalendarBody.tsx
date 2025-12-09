'use client';
import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import cn from '~/lib/utils/className';

import { Table } from '@digdir/designsystemet-react';

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
}

export default function CalendarBody({ selectedView, selectedDate, displayWeekends, currentSearchResults }: CalendarBodyProps) {

    return (
        <>
            {selectedView === 'month' && (
                <Table
                    stickyHeader
                    data-size='sm'
                    className={cn(styles.meetingTable)}>
                    <MonthView selectedDate={selectedDate} displayWeekends={displayWeekends} currentSearchResults={currentSearchResults} />
                </Table>
            )}
            {selectedView === 'week' && (
                <Table
                    stickyHeader
                    className={cn(styles.meetingTable)}>
                    <WeekView selectedDate={selectedDate} displayWeekends={displayWeekends} currentSearchResults={currentSearchResults} />
                </Table>
            )}
            {selectedView === 'day' && (
                <Table
                    stickyHeader
                    className={cn(styles.meetingTable)}>
                    <DayView selectedDate={selectedDate} currentSearchResults={currentSearchResults} />
                </Table>
            )}
            {selectedView === 'dynamic' && (
                <Dynamic selectedDate={selectedDate} displayWeekends={displayWeekends} currentSearchResults={currentSearchResults} />
            )}
        </>
    );
}