'use client';
import { useState } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import type { PaginatedList, Base } from '@digdir/einnsyn-sdk';
import MonthView from './CalendarViews/Month'
import WeekView from './CalendarViews/Week'
import DayView from './CalendarViews/Day'

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';
import { Table } from '@digdir/designsystemet-react';

interface CalendarBodyProps {
    selectedView: string;
    selectedDate: Date;
    displayWeekends: boolean;
    currentSearchResults: PaginatedList<Base>;
}

export default function CalendarBody({ selectedView, selectedDate, displayWeekends, currentSearchResults }: CalendarBodyProps) {
    const t = useTranslation();

    return (
        <>
            {selectedView === 'month' && (
                <Table
                    stickyHeader
                    data-size='sm'
                    className={styles.meetingTable}>
                    <MonthView selectedDate={selectedDate} displayWeekends={displayWeekends} currentSearchResults={currentSearchResults} />
                </Table>
            )}
            {selectedView === 'week' && (
                <Table
                    stickyHeader
                    className={styles.meetingTable}>
                    <WeekView selectedDate={selectedDate} displayWeekends={displayWeekends} currentSearchResults={currentSearchResults} />
                </Table>
            )}
            {selectedView === 'day' && (
                <Table
                    stickyHeader
                    className={styles.meetingTable}>
                    <DayView selectedDate={selectedDate} displayWeekends={displayWeekends} currentSearchResults={currentSearchResults} />
                </Table>
            )}
        </>
    );
}