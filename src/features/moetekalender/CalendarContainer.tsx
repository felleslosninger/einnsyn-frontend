'use client';
import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSearchField } from '~/components/SearchField/SearchFieldProvider';
import { fetchNextPage } from '~/lib/utils/pagination';
import { getDateRange } from './DateRange';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';

import CalendarBody from './CalendarBody';
import CalendarHeader from './CalendarHeader';

import { isMoetemappe } from '@digdir/einnsyn-sdk';


const formatDateForUrl = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const hasWeekendMeetings = (results: PaginatedList<Base>) => {
    return results.items.some(item => {
        if (isMoetemappe(item)) {
            const meetingDate = item.moetedato ? new Date(item.moetedato) : null;
            if (!meetingDate) return false;
            const day = meetingDate.getDay();
            return day === 0 || day === 6;
        }
        return false;
    });
};

export const sortMeetingsByTime = (items: Base[]) => {
    return items.sort((a, b) => {
        if (!isMoetemappe(a) || !isMoetemappe(b)) return 0;

        const timeA = a.moetedato ? new Date(a.moetedato).getTime() : 0;
        const timeB = b.moetedato ? new Date(b.moetedato).getTime() : 0;

        return timeA - timeB;
    });
};


export default function CalendarContainer({
    searchResults
}: {
    searchResults: PaginatedList<Base>;
}) {
    const { getProperty, setProperty } = useSearchField();

    const [selectedView, setSelectedView] = useState('dynamic');
    const [displayWeekends, setDisplayWeekends] = useState(() => hasWeekendMeetings(searchResults));
    const [allResults, setAllResults] = useState<PaginatedList<Base>>(searchResults);

    const [selectedDate, setSelectedDate] = useState(() => {
        const moetedato = getProperty('moetedato');
        if (moetedato) {
            const dateMatch = moetedato.match(/(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
                const startDate = new Date(dateMatch[1]);
                const endDate = new Date(dateMatch[2]);

                if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
                    const middleTime = (startDate.getTime() + endDate.getTime()) / 2;
                    return new Date(middleTime);
                }
            }
        }
        return new Date();
    });

    const currentDateRange = useMemo(() => {
        return getDateRange(selectedDate, selectedView);
    }, [selectedDate, selectedView]);

    const updateDateRangeProperty = useCallback(() => {
        const startDate = formatDateForUrl(currentDateRange.start);
        const endDate = formatDateForUrl(currentDateRange.end);
        const dateRangeQuery = `${startDate}/${endDate}`;

        const existing = getProperty('moetedato');
        if (existing !== dateRangeQuery) {
            setProperty('moetedato', dateRangeQuery);
        }
    }, [currentDateRange, setProperty, getProperty]);



    const fetchAllResults = useCallback(async (currentResults: PaginatedList<Base>) => {
        let i = 0;
        const moetedato = getProperty('moetedato');
        console.log('Fetching all results for date range:', moetedato);
        if (!moetedato) {
            setAllResults(currentResults);
            return;
        }

        while (currentResults.next && i < 6) { // TODO: Remove temporary limit pages to avoid infinite loops
            try {
                currentResults = await fetchNextPage(currentResults, true);
                console.log(i);
                i++;
            } catch (error) {
                console.error('Error fetching next page:', error);
                break;
            }
        }
        setAllResults(currentResults);

    }, [getProperty]);

    useEffect(() => {
        hasWeekendMeetings(searchResults) ? setDisplayWeekends(true) : null;
    }, [searchResults]);

    useEffect(() => {
        updateDateRangeProperty();
    }, [updateDateRangeProperty]);

    useEffect(() => {
        fetchAllResults(searchResults);
    }, [searchResults, fetchAllResults]);


    return (
        <div className={cn(
            'container-wrapper',
            'main-content',
            styles.calendarContainer,
        )}>
            <div className="container-pre collapsible" />

            <div className={cn('calendar-content', styles.calendarContent)}>
                <CalendarHeader
                    selectedView={selectedView}
                    setSelectedView={setSelectedView}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    displayWeekends={displayWeekends}
                    setDisplayWeekends={setDisplayWeekends} />
                <div className={cn(styles.calendarBody)}>
                    <CalendarBody
                        selectedView={selectedView}
                        selectedDate={selectedDate}
                        displayWeekends={displayWeekends}
                        currentSearchResults={allResults}
                        setSelectedDate={setSelectedDate} />
                </div>
            </div>

            {/* <div className="container-post collapsible" /> */}
        </div>
    );
}


//TODO: Fix display of many meetings on same day

//TODO: Utilize full page width for calendar
//TODO: Implement dynamic view 

//TODO: Fix infinite run on inital load
//TODO: Fix mobile view
//TODO: fix change of view on reload