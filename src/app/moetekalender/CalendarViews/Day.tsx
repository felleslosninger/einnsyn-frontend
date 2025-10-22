import { Table } from '@digdir/designsystemet-react';
import styles from './CalendarBody.module.scss';
import { useTranslation } from '~/hooks/useTranslation';

export default function DayView({ selectedDate, displayWeekends }: { selectedDate: Date; displayWeekends: boolean }) {
    const t = useTranslation();

    return (
        <>
            <Table.Head>
                <Table.Row>
                    <Table.HeaderCell>{t('moetekalender.days.monday')}</Table.HeaderCell>
                </Table.Row>
            </Table.Head>
            <Table.Body>
                <Table.Row>
                    <Table.Cell>1</Table.Cell>
                </Table.Row>
            </Table.Body>
        </>
    );
}