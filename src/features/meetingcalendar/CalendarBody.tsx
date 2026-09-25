'use client';
import type { Moetemappe } from '@digdir/einnsyn-sdk';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';

import DayView from './CalendarViews/Day';
import Dynamic from './CalendarViews/Dynamic';
import MonthView from './CalendarViews/Month';
import WeekView from './CalendarViews/Week';
import type { CalendarView } from './calendarHelpers';

interface CalendarBodyProps {
  selectedView: CalendarView;
  selectedDate: Date;
  displayWeekends: boolean;
  currentCalendarResults: Moetemappe[];
  setSelectedView: (view: CalendarView) => void;
  setSelectedDate: (date: Date) => void;
}

export default function CalendarBody({
  selectedView,
  selectedDate,
  displayWeekends,
  currentCalendarResults,
  setSelectedView,
  setSelectedDate,
}: CalendarBodyProps) {
  return (
    <div
      className={cn(
        styles.calendarBody,
        selectedView === 'month'
          ? styles.monthView
          : selectedView === 'week'
            ? styles.weekView
            : selectedView === 'day'
              ? styles.dayView
              : styles.dynamicView,
      )}
    >
      {selectedView === 'month' && (
        <MonthView
          selectedDate={selectedDate}
          displayWeekends={displayWeekends}
          currentCalendarResults={currentCalendarResults}
        />
      )}
      {selectedView === 'week' && (
        <WeekView
          selectedDate={selectedDate}
          displayWeekends={displayWeekends}
          currentCalendarResults={currentCalendarResults}
        />
      )}
      {selectedView === 'day' && (
        <DayView
          selectedDate={selectedDate}
          currentCalendarResults={currentCalendarResults}
        />
      )}
      {selectedView === 'dynamic' && (
        <Dynamic
          selectedDate={selectedDate}
          displayWeekends={displayWeekends}
          currentCalendarResults={currentCalendarResults}
          setSelectedView={setSelectedView}
          setSelectedDate={setSelectedDate}
        />
      )}
    </div>
  );
}
