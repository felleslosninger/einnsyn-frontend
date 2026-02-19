import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from '../CalendarContainer.module.scss';
import MoetemappeModule, { MeetingSkeleton } from '../Moetemappe';

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
    <div className={styles.weekCalendarWrapper}>
      <div
        className={cn(
          styles.calendarGrid,
          displayWeekends ? styles.withWeekends : styles.noWeekends,
        )}
      >
        <div className={styles.dynCalendarHeader}>
          <div className={styles.dayHeaderCell}>
            <span className={styles.dayHeaderText}>
              {t('meetingcalendar.days.monday')}
            </span>
          </div>
          <div className={styles.dayHeaderCell}>
            <span className={styles.dayHeaderText}>
              {t('meetingcalendar.days.tuesday')}
            </span>
          </div>
          <div className={styles.dayHeaderCell}>
            <span className={styles.dayHeaderText}>
              {t('meetingcalendar.days.wednesday')}
            </span>
          </div>
          <div className={styles.dayHeaderCell}>
            <span className={styles.dayHeaderText}>
              {t('meetingcalendar.days.thursday')}
            </span>
          </div>
          <div className={styles.dayHeaderCell}>
            <span className={styles.dayHeaderText}>
              {t('meetingcalendar.days.friday')}
            </span>
          </div>
          {displayWeekends && (
            <>
              <div className={styles.dayHeaderCell}>
                <span className={styles.dayHeaderText}>
                  {t('meetingcalendar.days.saturday')}
                </span>
              </div>
              <div className={styles.dayHeaderCell}>
                <span className={styles.dayHeaderText}>
                  {t('meetingcalendar.days.sunday')}
                </span>
              </div>
            </>
          )}
        </div>

        <div className={styles.weekRow}>
          {calendarDays.map((day) => (
            <div
              key={day.date.toISOString()}
              className={cn(styles.dayCell, day.isToday ? styles.today : '')}
            >
              <span className={styles.dateText}>{day.dayNumber}</span>

              {isLoading ? (
                // Render 1-2 skeletons per day to show activity
                <>
                  <MeetingSkeleton />
                  {Math.random() > 0.5 && <MeetingSkeleton />}
                </>
              ) : (
                currentCalendarResults
                  .filter(
                    (item) =>
                      item.moetedato &&
                      new Date(item.moetedato).toDateString() ===
                        day.date.toDateString(),
                  )
                  .map((item) => <MoetemappeModule key={item.id} item={item} />)
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
