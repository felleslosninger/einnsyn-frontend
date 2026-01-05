import { useTranslation } from '~/hooks/useTranslation';
import { Base, isMoetemappe, PaginatedList } from '@digdir/einnsyn-sdk';
import { sortMeetingsByTime } from '../CalendarContainer';
import cn from '~/lib/utils/className';
import styles from '../CalendarContainer.module.scss';
import MoetemappeModule from '../Moetemappe';

export default function WeekView({ selectedDate, displayWeekends, currentSearchResults }: { selectedDate: Date; displayWeekends: boolean; currentSearchResults: PaginatedList<Base> }) {
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
                isToday
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
                    displayWeekends ? styles.withWeekends : styles.noWeekends
                )}
            >
                <div className={styles.dynCalendarHeader}>
                    <div className={styles.dayHeaderCell}>
                        <span className={styles.dayHeaderText}>
                            {t('moetekalender.days.monday')}
                        </span>
                    </div>
                    <div className={styles.dayHeaderCell}>
                        <span className={styles.dayHeaderText}>
                            {t('moetekalender.days.tuesday')}
                        </span>
                    </div>
                    <div className={styles.dayHeaderCell}>
                        <span className={styles.dayHeaderText}>
                            {t('moetekalender.days.wednesday')}
                        </span>
                    </div>
                    <div className={styles.dayHeaderCell}>
                        <span className={styles.dayHeaderText}>
                            {t('moetekalender.days.thursday')}
                        </span>
                    </div>
                    <div className={styles.dayHeaderCell}>
                        <span className={styles.dayHeaderText}>
                            {t('moetekalender.days.friday')}
                        </span>
                    </div>
                    {displayWeekends && (
                        <>
                            <div className={styles.dayHeaderCell}>
                                <span className={styles.dayHeaderText}>
                                    {t('moetekalender.days.saturday')}
                                </span>
                            </div>
                            <div className={styles.dayHeaderCell}>
                                <span className={styles.dayHeaderText}>
                                    {t('moetekalender.days.sunday')}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.weekRow}>
                    {calendarDays.map((day) => (
                        <div
                            key={day.date.toISOString()}
                            className={cn(
                                styles.dayCell,
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
                    ))}
                </div>
            </div>
        </div>
    );
}