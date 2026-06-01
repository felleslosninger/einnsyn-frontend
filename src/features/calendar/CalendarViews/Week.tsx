import { Badge } from '@digdir/designsystemet-react';
import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from '../CalendarContainer.module.scss';
import MoetemappeModule from '../Moetemappe';
import { MoetemappeSkeleton } from '../MoetemappeSkeleton';

export default function WeekView({
  isLoading,
  selectedDate,
  displayWeekends,
  currentCalendarResults,
}: {
  isLoading: boolean;
  selectedDate: Date;
  displayWeekends: boolean;
  currentCalendarResults: Moetemappe[];
}) {
  const t = useTranslation();

  const getFirstDayOfWeek = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const firstDayOfWeek = getFirstDayOfWeek(new Date(selectedDate));

  const generateCalendarDays = () => {
    const days = [];
    const current = new Date(firstDayOfWeek);
    const daysPerWeek = displayWeekends ? 7 : 5;

    for (let day = 0; day < daysPerWeek; day++) {
      const isToday = current.toDateString() === new Date().toDateString();

      days.push({
        date: new Date(current),
        dayNumber: current.getDate(),
        isToday,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div
      className={cn(
        styles.calendarGrid,
        displayWeekends ? styles.withWeekends : styles.noWeekends,
      )}
    >
      <div className={styles.dynCalendarHeader}>
        {(displayWeekends ? [1, 2, 3, 4, 5, 6, 0] : [1, 2, 3, 4, 5]).map(
          (d) => (
            <div key={d} className={styles.dayHeaderCell}>
              <span className={styles.dayHeaderText}>
                {t(`calendar.days.${d}`)}
              </span>
            </div>
          ),
        )}
      </div>

      <div className={styles.weekRow}>
        {calendarDays.map((day) => {
          const dayMeetings = currentCalendarResults.filter(
            (item) =>
              item.moetedato &&
              new Date(item.moetedato).toDateString() ===
                day.date.toDateString(),
          );
          return (
            <div
              key={day.date.toISOString()}
              className={cn(styles.dayCell, day.isToday ? styles.today : '')}
            >
              <div>
                {day.isToday ? (
                  <Badge className={styles.dateText} count={day.dayNumber} />
                ) : (
                  <span className={styles.dateText}>{day.dayNumber}</span>
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
