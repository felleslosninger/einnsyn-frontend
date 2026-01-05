import { useTranslation } from '~/hooks/useTranslation';
import { Base, isMoetemappe, PaginatedList } from '@digdir/einnsyn-sdk';
import { sortMeetingsByTime } from '../CalendarContainer'
import cn from '~/lib/utils/className';
import styles from '../CalendarContainer.module.scss';
import MoetemappeModule from '../Moetemappe';

export default function MonthView({ selectedDate, displayWeekends, currentSearchResults }: { selectedDate: Date; displayWeekends: boolean; currentSearchResults: PaginatedList<Base> }) {
    const t = useTranslation();

    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const startDate = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDayOfMonth.getDate() - daysToSubtract);

    const generateCalendarDays = () => {
        const days = [];
        const current = new Date(startDate);
        const weeksToShow = 6;
        const daysPerWeek = displayWeekends ? 7 : 5;

        for (let week = 0; week < weeksToShow; week++) {
            const weekDays = [];
            for (let day = 0; day < daysPerWeek; day++) {
                const isCurrentMonth = current.getMonth() === selectedDate.getMonth();
                const isToday = current.toDateString() === new Date().toDateString();

                weekDays.push({
                    date: new Date(current),
                    dayNumber: current.getDate(),
                    isCurrentMonth,
                    isToday
                });

                current.setDate(current.getDate() + 1);
            }

            if (!displayWeekends) {
                current.setDate(current.getDate() + 2);
            }

            days.push(weekDays);
        }

        return days;
    };

    const calendarWeeks = generateCalendarDays();

    return (
        <div className={styles.monthCalendarWrapper}>
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

                {calendarWeeks.map((week) => (
                    <div key={week[0].date.toISOString()} className={styles.weekRow}>
                        {week.map((day) => (
                            <div
                                key={day.date.toISOString()}
                                className={cn(
                                    styles.dayCell,
                                    !day.isCurrentMonth ? styles.otherMonth : '',
                                    day.isToday ? styles.today : ''
                                )}
                            >
                                <span className={styles.dateText}>
                                    {day.date.getDate()}
                                    {day.date.getDate() === 1 && (
                                        <> {t(`moetekalender.months.${day.date.getMonth()}`)}</>
                                    )}
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
                ))}
            </div>
        </div>
    );
}