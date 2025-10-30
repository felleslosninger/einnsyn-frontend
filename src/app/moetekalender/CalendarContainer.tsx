'use client';
import { useEffect, useState } from 'react';
import type { PaginatedList, Base } from '@digdir/einnsyn-sdk';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';

import CalendarHeader from './CalendarHeader';
import CalendarBody from './CalendarBody';
import MoetemappeModule from './Moetemappe';
import { isMoetemappe } from '@digdir/einnsyn-sdk';

export default function CalendarContainer({
    searchResults
}: {
    searchResults: PaginatedList<Base>;
}) {
    const [currentSearchResults, setCurrentSearchResults] =
        useState<PaginatedList<Base>>(searchResults);

    // Update currentSearchResults when searchResults prop changes (new search)
    useEffect(() => {
        setCurrentSearchResults(searchResults);
    }, [searchResults]);


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
                    displayWeekends={displayWeekends}
                    currentSearchResults={currentSearchResults} />
            </div>

            {/* <div className="container-post collapsible" /> */}
        </div>
    );
}

// TODO: fix calendar searchResults, pagination issues. 