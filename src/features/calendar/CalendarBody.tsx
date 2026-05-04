'use client';
import type { Moetemappe } from '@digdir/einnsyn-sdk';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';

import DayView from './CalendarViews/Day';
import MonthView from './CalendarViews/Month';
import WeekView from './CalendarViews/Week';
import type { CalendarView } from './calendarHelpers';

interface CalendarBodyProps {
  isLoading: boolean;
  selectedView: CalendarView;
  selectedDate: Date;
  displayWeekends: boolean;
  currentCalendarResults: Moetemappe[];
  setSelectedView: (view: CalendarView) => void;
  setSelectedDate: (date: Date) => void;
  setVisibleMonth: (date: Date) => void;
}

export default function CalendarBody({
  isLoading,
  selectedView,
  selectedDate,
  displayWeekends,
  currentCalendarResults,
  setVisibleMonth,
}: CalendarBodyProps) {
  return (
    <div
      className={cn(
        styles.calendarBody,
        selectedView === 'week'
          ? styles.weekView
          : selectedView === 'day'
            ? styles.dayView
            : styles.monthView,
      )}
    >
      {selectedView === 'week' && (
        <WeekView
          isLoading={isLoading}
          selectedDate={selectedDate}
          displayWeekends={displayWeekends}
          currentCalendarResults={currentCalendarResults}
        />
      )}
      {selectedView === 'day' && (
        <DayView
          isLoading={isLoading}
          selectedDate={selectedDate}
          currentCalendarResults={currentCalendarResults}
        />
      )}
      {selectedView === 'month' && (
        <MonthView
          isLoading={isLoading}
          selectedDate={selectedDate}
          displayWeekends={displayWeekends}
          currentCalendarResults={currentCalendarResults}
          setVisibleMonth={setVisibleMonth}
        />
      )}
    </div>
  );
}
