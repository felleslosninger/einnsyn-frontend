import { useTranslation } from '~/hooks/useTranslation';

import { Table } from '@digdir/designsystemet-react';
import { Base, isMoetemappe, PaginatedList } from '@digdir/einnsyn-sdk';

import styles from '../CalendarContainer.module.scss';
import MoetemappeModule from '../Moetemappe';

export default function WeekView({ selectedDate, displayWeekends, currentSearchResults }: { selectedDate: Date; displayWeekends: boolean; currentSearchResults: PaginatedList<Base> }) {
    const t = useTranslation();

    const getFirstDayOfWeek = (date: Date) => {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
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
        <>
            <Table.Head>
                <Table.Row>
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
                <Table.Row className={`${styles.row} ${styles.weekrow}`}>
                    {calendarDays.map((day) => (
                        <Table.Cell
                            key={day.date.getTime()}
                            className={`
                                ${day.isToday ? styles.today : ''}
                            `}
                        >
                            <div className={styles.cellHeader}>
                                <span className={styles.dateNumber}>{day.dayNumber}</span>
                                {(() => {
                                    const count = currentSearchResults.items.filter(item =>
                                        isMoetemappe(item) && new Date(item.moetedato).toDateString() === day.date.toDateString()
                                    ).length;
                                    return `${count} ${count === 1 ? t('moetemappe.label') : t('moetemappe.labelPlural')}`.toLowerCase();
                                })()}
                            </div>

                            {currentSearchResults.items.map((item) => (
                                (isMoetemappe(item) && (new Date(item.moetedato).toDateString() === day.date.toDateString())) && <MoetemappeModule key={item.id} item={item} />
                            ))}
                        </Table.Cell>
                    ))}
                </Table.Row>
            </Table.Body>
        </>
    );
}