import { Badge } from '@digdir/designsystemet-react';
import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from '../CalendarContainer.module.scss';
import MoetemappeModule from '../Moetemappe';
import { MoetemappeSkeleton } from '../MoetemappeSkeleton';

type Props = {
  isLoading: boolean;
  selectedDate: Date;
  displayWeekends: boolean;
  currentCalendarResults: Moetemappe[];
};

const getFirstDayOfWeek = (date: Date): Date => {
  const dayOfWeek = date.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const first = new Date(date);
  first.setDate(first.getDate() - mondayOffset);
  return first;
};

const WEEKDAY_LABELS = [1, 2, 3, 4, 5];
const WEEKDAY_LABELS_WITH_WEEKEND = [1, 2, 3, 4, 5, 6, 0];

export default function WeekView({
  isLoading,
  selectedDate,
  displayWeekends,
  currentCalendarResults,
}: Props) {
  const t = useTranslation();
  const todayString = new Date().toDateString();

  const firstDay = getFirstDayOfWeek(selectedDate);
  const daysPerWeek = displayWeekends ? 7 : 5;
  const days = Array.from({ length: daysPerWeek }, (_, i) => {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + i);
    return { date, isToday: date.toDateString() === todayString };
  });

  const dayLabels = displayWeekends
    ? WEEKDAY_LABELS_WITH_WEEKEND
    : WEEKDAY_LABELS;

  return (
    <div
      className={cn(
        styles.calendarGrid,
        displayWeekends ? styles.withWeekends : styles.noWeekends,
      )}
    >
      <div className={styles.dynCalendarHeader}>
        {dayLabels.map((d) => (
          <div key={d} className={styles.dayHeaderCell}>
            <span className={styles.dayHeaderText}>
              {t(`calendar.days.${d}`)}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.weekRow}>
        {days.map((day) => {
          const dayString = day.date.toDateString();
          const dayMeetings = currentCalendarResults.filter(
            (item) =>
              item.moetedato &&
              new Date(item.moetedato).toDateString() === dayString,
          );
          return (
            <div
              key={day.date.toISOString()}
              className={cn(
                styles.dayCell,
                day.isToday ? styles.today : undefined,
              )}
            >
              <div>
                {day.isToday ? (
                  <Badge
                    className={styles.dateText}
                    count={day.date.getDate()}
                  />
                ) : (
                  <span className={styles.dateText}>{day.date.getDate()}</span>
                )}
              </div>
              <div className={styles.meetingList}>
                {isLoading ? (
                  <>
                    <MoetemappeSkeleton />
                    <MoetemappeSkeleton />
                  </>
                ) : (
                  dayMeetings.map((item) => (
                    <MoetemappeModule key={item.id} item={item} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
