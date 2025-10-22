'use client';
import { useState } from 'react';
import type { PaginatedList, Base } from '@digdir/einnsyn-sdk';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';
import { Button, Dropdown, Heading } from '@digdir/designsystemet-react';
import { ChevronDownIcon, ChevronUpIcon } from '@navikt/aksel-icons';
import CalendarHeader from './CalendarHeader';
import CalendarBody from './CalendarBody';

export default function CalendarContainer() {
    const [selectedView, setSelectedView] = useState('month');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [displayWeekends, setDisplayWeekends] = useState(false);

    return (
        <div className={cn(
            'container-wrapper',
            'main-content',
            styles.calendarContainer,
        )}>
            <div className="container-pre collapsible" />

            <div className="container">
                <CalendarHeader
                    selectedView={selectedView}
                    setSelectedView={setSelectedView}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    displayWeekends={displayWeekends}
                    setDisplayWeekends={setDisplayWeekends} />
                <CalendarBody
                    selectedView={selectedView}
                    selectedDate={selectedDate}
                    displayWeekends={displayWeekends} />

            </div>

            <div className="container-post collapsible" />
        </div>
    );
}