'use client';
import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from '~/hooks/useTranslation';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';
import { Button, Checkbox, Divider, Dropdown, Heading } from '@digdir/designsystemet-react';
import { CalendarIcon, ChevronDownIcon, ChevronUpIcon } from '@navikt/aksel-icons';
import { DateFilter } from '~/app/search/searchheader/filter/DateFilter';
import { useSearchField } from '~/components/SearchField/SearchFieldProvider';

interface CalendarHeaderProps {
    selectedView: string;
    setSelectedView: (view: string) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    displayWeekends: boolean;
    setDisplayWeekends: (display: boolean) => void;
}

export default function CalendarHeader({ selectedView, setSelectedView, selectedDate, setSelectedDate, displayWeekends, setDisplayWeekends }: CalendarHeaderProps) {
    const t = useTranslation();
    const [open, setOpen] = useState(false);

    const { getProperty, setProperty } = useSearchField();

    const getSetter = useCallback(
        (property: string) => (value: string | undefined) =>
            setProperty(property, value),
        [setProperty],
    );

    const setMoeteDato = useMemo(() => getSetter('moetedato'), [getSetter]);


    // const [expandAll, setExpandAll] = useState(false);


    const viewHeading = useMemo(() => {
        const getWeekNumber = (date: Date): number => {
            const tempDate = new Date(date.getTime());
            tempDate.setHours(0, 0, 0, 0);
            tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
            const week1 = new Date(tempDate.getFullYear(), 0, 4);
            return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        };

        switch (selectedView) {
            case 'month':
                return `${t(`moetekalender.months.${selectedDate.getMonth()}`)} ${selectedDate.getFullYear()}`;

            case 'week':
                {
                    const weekNumber = getWeekNumber(selectedDate);
                    return `${t('moetekalender.viewOptions.week')} ${weekNumber}`;
                }

            case 'day':
                return selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                });

            default:
                return '';
        }
    }, [selectedView, selectedDate, t]);

    const changeMonth = (offset: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setSelectedDate(newDate);
    }

    return (
        <div className={cn('calendarHeader', styles.calendarHeader)}>
            <div className={cn('navigation', styles.navigation)}>
                <Dropdown.TriggerContext>
                    <Dropdown.Trigger
                        data-color="neutral"
                        data-size="sm"
                        variant="secondary"
                        onClick={() => setOpen(!open)}>
                        {t(`moetekalender.viewOptions.${selectedView}`)}
                        {open ? <ChevronDownIcon aria-hidden /> : <ChevronUpIcon aria-hidden />}
                    </Dropdown.Trigger>
                    <Dropdown
                        data-color="neutral"
                        data-size="sm"
                        placement="bottom-start"
                        open={open} onClose={() => setOpen(false)}>

                        <Dropdown.List>
                            <Dropdown.Item>
                                <Dropdown.Button onClick={() => { setOpen(false); setSelectedView('month'); }}>
                                    {t('moetekalender.viewOptions.month')}
                                </Dropdown.Button>
                            </Dropdown.Item>
                            <Dropdown.Item>
                                <Dropdown.Button onClick={() => { setOpen(false); setSelectedView('week'); }}>
                                    {t('moetekalender.viewOptions.week')}
                                </Dropdown.Button>
                            </Dropdown.Item>
                            <Dropdown.Item>
                                <Dropdown.Button onClick={() => { setOpen(false); setSelectedView('day'); }}>
                                    {t('moetekalender.viewOptions.day')}
                                </Dropdown.Button>
                            </Dropdown.Item>
                            <Divider />
                            <Dropdown.Item>
                                <Checkbox className={styles.checkbox} label={t('moetekalender.viewOptions.displayWeekends')}
                                    onClick={() => { setDisplayWeekends(!displayWeekends) }} />
                            </Dropdown.Item>
                            <Dropdown.Item>
                                <Checkbox className={styles.checkbox} label={t('moetekalender.viewOptions.expandAll')} />
                            </Dropdown.Item>
                        </Dropdown.List>
                    </Dropdown>
                </Dropdown.TriggerContext>

                <div className={cn('datePicker', styles.datePicker)}>
                    <div className={styles.dateField}>
                        <label className={styles.dateLabel}>
                            <input
                                type="date"
                                className={cn(styles.dateInput)}
                                value={selectedDate.toISOString().split('T')[0]}
                                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            />
                        </label>
                    </div>
                </div>

                <Button
                    data-color="neutral"
                    data-size="sm"
                    icon
                    type="button"
                    variant="tertiary"
                    onClick={() => changeMonth(-1)} // Previous Month
                >
                    <ChevronUpIcon className={cn(styles.arrowIcon)} />
                </Button>

                <Button
                    data-color="neutral"
                    data-size="sm"
                    icon
                    type="button"
                    variant="tertiary"
                    onClick={() => changeMonth(1)} // Next Month
                >
                    <ChevronDownIcon className={cn(styles.arrowIcon)} />
                </Button>
            </div>

            <div className={cn('displayHeading', styles.displayHeading)}>
                <Heading
                    data-size="md"
                    level={1}>
                    {viewHeading}
                </Heading>
            </div>
        </div>
    );
}