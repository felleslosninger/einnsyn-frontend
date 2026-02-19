import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from '../CalendarContainer.module.scss';
import MoetemappeModule from '../Moetemappe';
import { MeetingSkeleton } from '../Moetemappe';

export default function DayView({
  isLoading,
  selectedDate,
  currentCalendarResults,
}: {
  isLoading: boolean;
  selectedDate: Date;
  currentCalendarResults: Moetemappe[];
}) {
  const t = useTranslation();

  const day = {
    date: selectedDate,
    dayNumber: selectedDate.getDate(),
    isToday: selectedDate.toDateString() === new Date().toDateString(),
  };

  const dayName = selectedDate
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  return (
    <div className={styles.dayCalendarWrapper}>
      <div className={styles.calendarGrid}>
        <div className={styles.dynCalendarHeader}>
          <div className={styles.dayHeaderCell}>
            <span className={styles.dayHeaderText}>
              {t(`meetingcalendar.days.${dayName}`)}
            </span>
          </div>
        </div>

        <div className={styles.singleDayRow}>
          <div
            className={cn(
              styles.dayCell,
              styles.singleDay,
              day.isToday ? styles.today : '',
            )}
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
        </div>
      </div>
    </div>
  );
}
