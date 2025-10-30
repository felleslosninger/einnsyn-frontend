import { Table } from '@digdir/designsystemet-react';
import styles from '../CalendarContainer.module.scss';
import { useTranslation } from '~/hooks/useTranslation';
import { isMoetemappe, PaginatedList, Base } from '@digdir/einnsyn-sdk';
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
                {calendarWeeks.map((week) => (
                    <Table.Row key={week[0].date.toISOString()} className={styles.row}>
                        {week.map((day) => (
                            <Table.Cell
                                key={day.date.toISOString()}
                                className={`
                                    ${!day.isCurrentMonth ? styles.otherMonth : ''}
                                    ${day.isToday ? styles.today : ''}
                                `}
                            >
                                <div className={styles.cellHeader}>
                                    <span className={styles.dateNumber}>{day.dayNumber}</span>
                                    <span className={styles.moeteCount}> {t('moetemappe.labelPlural').toLowerCase()} </span>

                                </div>

                                {currentSearchResults.items.map((item) => (
                                    (isMoetemappe(item) && (new Date(item.moetedato).toDateString() === day.date.toDateString())) && <MoetemappeModule key={item.id} item={item} />
                                ))}
                            </Table.Cell>
                        ))}
                    </Table.Row>
                ))}
            </Table.Body>
        </>
    );
}