import { Badge } from '@digdir/designsystemet-react';
import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import styles from '../CalendarContainer.module.scss';
import MoetemappeModule from '../Moetemappe';
import { MoetemappeSkeleton } from '../MoetemappeSkeleton';

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

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const dayKey = selectedDate.getDay();

  const dayMeetings = currentCalendarResults.filter(
    (item) =>
      item.moetedato &&
      new Date(item.moetedato).toDateString() === selectedDate.toDateString(),
  );

  return (
    <div className={styles.dayCalendarWrapper}>
      <div className={styles.calendarGrid}>
        <div className={cn(styles.dynCalendarHeader, styles.singleColumn)}>
          <div className={styles.dayHeaderCell}>
            <span className={styles.dayHeaderText}>
              {t(`calendar.days.${dayKey}`)}
            </span>
          </div>
        </div>

        <div className={cn(styles.weekRow, styles.singleColumn)}>
          <div className={cn(styles.dayCell, isToday ? styles.today : '')}>
            <div className={styles.dateHeader}>
              {isToday ? (
                <Badge
                  className={cn(styles.dateText, styles.today)}
                  count={selectedDate.getDate()}
                />
              ) : (
                <span className={styles.dateText}>
                  {selectedDate.getDate()}
                </span>
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
        </div>
      </div>
    </div>
  );
}
