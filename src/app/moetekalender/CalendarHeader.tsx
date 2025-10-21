'use client';
import { useState } from 'react';
import type { PaginatedList, Base } from '@digdir/einnsyn-sdk';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';
import { Button, Dropdown, Heading } from '@digdir/designsystemet-react';
import { ChevronDownIcon, ChevronUpIcon } from '@navikt/aksel-icons';

export default function CalendarHeader() {
    const [open, setOpen] = useState(false);
    return (
        <div className={cn('calendarHeader', styles.calendarHeader)}>
            <div className={cn('navigation', styles.navigation)}>
                <Dropdown.TriggerContext>
                    <Dropdown.Trigger
                        data-color="neutral"
                        data-size="sm"
                        onClick={() => setOpen(!open)}>
                        Måned
                        {open ? <ChevronDownIcon aria-hidden /> : <ChevronUpIcon aria-hidden />}
                    </Dropdown.Trigger>
                    <Dropdown
                        data-color="neutral"
                        data-size="sm"
                        placement="bottom-start"
                        open={open} onClose={() => setOpen(false)}>

                        <Dropdown.List>
                            <Dropdown.Item>
                                <Dropdown.Button onClick={() => setOpen(false)}>
                                    Uke
                                </Dropdown.Button>
                            </Dropdown.Item>
                            <Dropdown.Item>
                                <Dropdown.Button onClick={() => setOpen(false)}>
                                    Dag
                                </Dropdown.Button>
                            </Dropdown.Item>
                        </Dropdown.List>
                    </Dropdown>
                </Dropdown.TriggerContext>

                <Button
                    data-color="neutral"
                    data-size="sm"
                    type="button"
                    variant="primary"
                >
                    idag
                </Button>

                <Button
                    data-color="neutral"
                    data-size="sm"
                    icon
                    type="button"
                    variant="primary"
                >
                    <ChevronDownIcon></ChevronDownIcon>
                </Button>

                <Button
                    data-color="neutral"
                    data-size="sm"
                    icon
                    type="button"
                    variant="primary"
                >
                    <ChevronUpIcon></ChevronUpIcon>
                </Button>
            </div>

            <div className={cn('displayHeading', styles.displayHeading)}>
                <Heading
                    data-size="md"
                    level={1}>
                    Oktober 2025</Heading>
            </div>

        </div>
    );
}