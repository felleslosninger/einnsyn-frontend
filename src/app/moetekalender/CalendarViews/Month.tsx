import { Table } from '@digdir/designsystemet-react';
import styles from '../CalendarBody.module.scss';
import { useTranslation } from '~/hooks/useTranslation';

export default function MonthView({ selectedDate, displayWeekends }: { selectedDate: Date; displayWeekends: boolean }) {
    const t = useTranslation();

    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const startDate = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();

    // Adjust for Monday start (0 = Sunday, 1 = Monday, etc.)
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDayOfMonth.getDate() - daysToSubtract);

    // Generate calendar grid
    const generateCalendarDays = () => {
        const days = [];
        const current = new Date(startDate);
        const weeksToShow = 6; // Standard calendar shows 6 weeks
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

            // Skip weekends if displayWeekends is false
            if (!displayWeekends) {
                // Skip Saturday and Sunday
                current.setDate(current.getDate() + 2);
            }

            days.push(weekDays);
        }

        return days;
    };

    const calendarWeeks = generateCalendarDays();

    return (
        <>
            <Table.Head className={styles.head}>
                <Table.Row className={styles.headerRow}>
                    <Table.HeaderCell>{t('moetekalender.days.monday')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('moetekalender.days.tuesday')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('moetekalender.days.wednesday')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('moetekalender.days.thursday')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('moetekalender.days.friday')}</Table.HeaderCell>
                    {displayWeekends && (
                        <>
                            <Table.HeaderCell>{t('moetekalender.days.saturday')}</Table.HeaderCell>
                            <Table.HeaderCell>{t('moetekalender.days.sunday')}</Table.HeaderCell>
                        </>
                    )}
                </Table.Row>
            </Table.Head>
            <Table.Body className={styles.body}>
                {calendarWeeks.map((week, weekIndex) => (
                    <Table.Row key={weekIndex} className={styles.row}>
                        {week.map((day, dayIndex) => (
                            <Table.Cell
                                key={dayIndex}
                                className={`
                                    ${!day.isCurrentMonth ? styles.otherMonth : ''}
                                    ${day.isToday ? styles.today : ''}
                                `}
                            >
                                {day.dayNumber}
                            </Table.Cell>
                        ))}
                    </Table.Row>
                ))}
            </Table.Body>
        </>
    );
}