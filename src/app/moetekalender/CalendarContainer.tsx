'use client';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';
import type { PaginatedList, Base } from '@digdir/einnsyn-sdk';

export default function CalendarContainer() {
    return (
        <div className={cn(
            'container-wrapper',
            'main-content',
            styles.calendarContainer,
        )}>
            <div className="container-pre collapsible" />

            <div className="container">
                <div className="calendar-content">
                    Calendar
                </div>
            </div>

            <div className="container-post collapsible" />
        </div>
    );
}