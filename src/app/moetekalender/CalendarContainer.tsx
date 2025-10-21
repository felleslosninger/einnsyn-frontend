'use client';
import { useState } from 'react';
import type { PaginatedList, Base } from '@digdir/einnsyn-sdk';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';
import { Button, Dropdown, Heading } from '@digdir/designsystemet-react';
import { ChevronDownIcon, ChevronUpIcon } from '@navikt/aksel-icons';
import CalendarHeader from './CalendarHeader';

export default function CalendarContainer() {
    return (
        <div className={cn(
            'container-wrapper',
            'main-content',
            styles.calendarContainer,
        )}>
            <div className="container-pre collapsible" />

            <div className="container">
                <CalendarHeader />
                <div className={cn('calendarBody', styles.calendarBody)}>
                    content
                </div>
            </div>

            <div className="container-post collapsible" />
        </div>
    );
}