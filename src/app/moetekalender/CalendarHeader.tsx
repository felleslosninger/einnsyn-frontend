'use client';
import { useState } from 'react';
import { useTranslation } from '~/hooks/useTranslation';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';
import { Button, Checkbox, Divider, Dropdown, Heading } from '@digdir/designsystemet-react';
import { CalendarIcon, ChevronDownIcon, ChevronUpIcon } from '@navikt/aksel-icons';

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

    // const [expandAll, setExpandAll] = useState(false);

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
                    <Dropdown.TriggerContext>
                        <Dropdown.Trigger
                            className={cn('calendarButton', styles.calendarButton)}
                            data-color="neutral"
                            variant="secondary"
                            data-size="sm"
                            type="button">
                            <CalendarIcon className={cn('calendarIcon', styles.calendarIcon)} />
                        </Dropdown.Trigger>

                        <Dropdown
                            data-color="neutral"
                            data-size="sm"
                            placement="bottom-start">
                            <input type="date" onChange={(e) => setSelectedDate(new Date(e.target.value))} />
                        </Dropdown>
                    </Dropdown.TriggerContext>

                    <Button
                        data-color="neutral"
                        data-size="sm"
                        type="button"
                        variant="secondary"
                        onClick={() => { setSelectedDate(new Date()); }}
                    >
                        {t('moetekalender.viewOptions.today')}
                    </Button>
                </div>


                <Button
                    data-color="neutral"
                    data-size="sm"
                    icon
                    type="button"
                    variant="tertiary"
                >
                    <ChevronDownIcon className={cn(styles.arrowIcon)} />
                </Button>

                <Button
                    data-color="neutral"
                    data-size="sm"
                    icon
                    type="button"
                    variant="tertiary"
                >
                    <ChevronUpIcon className={cn(styles.arrowIcon)} />
                </Button>
            </div>

            <div className={cn('displayHeading', styles.displayHeading)}>
                <Heading
                    data-size="md"
                    level={1}>
                    Oktober 2025
                </Heading>
            </div>
        </div>
    );
}