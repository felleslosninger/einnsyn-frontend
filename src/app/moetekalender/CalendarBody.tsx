'use client';
import { useState } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import MonthView from './CalendarViews/Month'
import WeekView from './CalendarViews/Week'
import DayView from './CalendarViews/Day'

import cn from '~/lib/utils/className';
import styles from './CalendarBody.module.scss';
import { Table } from '@digdir/designsystemet-react';

interface CalendarBodyProps {
    selectedView: string;
    selectedDate: Date;
    displayWeekends: boolean;
}

export default function CalendarBody({ selectedView, selectedDate, displayWeekends }: CalendarBodyProps) {
    const t = useTranslation();

    return (
        <>
            {selectedView === 'month' && (
                <Table
                    stickyHeader
                    data-size='sm'
                    className={styles.meetingTable}>
                    <MonthView selectedDate={selectedDate} displayWeekends={displayWeekends} />
                </Table>
            )}
            {selectedView === 'week' && (
                <Table
                    stickyHeader
                    className={styles.meetingTable}>
                    <WeekView selectedDate={selectedDate} displayWeekends={displayWeekends} />
                </Table>
            )}
            {selectedView === 'day' && (
                <Table
                    stickyHeader
                    className={styles.meetingTable}>
                    <DayView selectedDate={selectedDate} displayWeekends={displayWeekends} />
                </Table>
            )}
        </>
    );
}