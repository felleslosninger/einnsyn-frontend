'use client';

import type { Moetemappe } from '@digdir/einnsyn-sdk';
import styles from './CalendarContainer.module.scss';
import DayView from './CalendarViews/Day';
import MonthView from './CalendarViews/Month';
import WeekView from './CalendarViews/Week';
import type { CalendarView } from './calendarHelpers';

type Props = {
  isLoading: boolean;
  selectedView: CalendarView;
  selectedDate: Date;
  displayWeekends: boolean;
  currentCalendarResults: Moetemappe[];
  setVisibleMonth: (date: Date) => void;
  loadedMonths: Set<string>;
};

export default function CalendarBody({
  isLoading,
  selectedView,
  selectedDate,
  displayWeekends,
  currentCalendarResults,
  setVisibleMonth,
  loadedMonths,
}: Props) {
  return (
    <div className={styles.calendarBody}>
      {selectedView === 'month' && (
        <MonthView
          isLoading={isLoading}
          selectedDate={selectedDate}
          displayWeekends={displayWeekends}
          currentCalendarResults={currentCalendarResults}
          setVisibleMonth={setVisibleMonth}
          loadedMonths={loadedMonths}
        />
      )}
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
    </div>
  );
}
