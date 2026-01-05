import { useTranslation } from '~/hooks/useTranslation';
import { Base, isMoetemappe, PaginatedList } from '@digdir/einnsyn-sdk';
import { sortMeetingsByTime } from '../CalendarContainer';
import cn from '~/lib/utils/className';
import styles from '../CalendarContainer.module.scss';
import MoetemappeModule from '../Moetemappe';

export default function DayView({ selectedDate, currentSearchResults }: { selectedDate: Date; currentSearchResults: PaginatedList<Base> }) {
    const t = useTranslation();

    const day = {
        date: selectedDate,
        dayNumber: selectedDate.getDate(),
        isToday: selectedDate.toDateString() === new Date().toDateString()
    };

    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    return (
        <div className={styles.dayCalendarWrapper}>
            <div className={styles.calendarGrid}>
                <div className={styles.dynCalendarHeader}>
                    <div className={styles.dayHeaderCell}>
                        <span className={styles.dayHeaderText}>
                            {t(`moetekalender.days.${dayName}`)}
                        </span>
                    </div>
                </div>

                <div className={styles.singleDayRow}>
                    <div
                        className={cn(
                            styles.dayCell,
                            styles.singleDay,
                            day.isToday ? styles.today : ''
                        )}
                    >
                        <span className={styles.dateText}>
                            {day.dayNumber}
                        </span>

                        {sortMeetingsByTime(
                            currentSearchResults.items.filter((item) =>
                                isMoetemappe(item) &&
                                new Date(item.moetedato).toDateString() === day.date.toDateString()
                            )
                        ).map((item) =>
                            isMoetemappe(item) ? <MoetemappeModule key={item.id} item={item} /> : null
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}