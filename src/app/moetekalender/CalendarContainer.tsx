'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { PaginatedList, Base } from '@digdir/einnsyn-sdk';

import { isMoetemappe } from '@digdir/einnsyn-sdk';
import { fetchNextPage } from '~/lib/utils/pagination';
import { useSearchField } from '~/components/SearchField/SearchFieldProvider';
import { getDateRange } from './DateRange';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';

import CalendarHeader from './CalendarHeader';
import CalendarBody from './CalendarBody';


const formatDateForUrl = (date: Date) => {
    return date.toISOString().split('T')[0];
};


export default function CalendarContainer({
    searchResults
}: {
    searchResults: PaginatedList<Base>;
}) {
    const { getProperty, setProperty } = useSearchField();

    const [selectedView, setSelectedView] = useState('month');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [displayWeekends, setDisplayWeekends] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [allResults, setAllResults] = useState<PaginatedList<Base>>(searchResults);



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

        while (currentResults.next && i < 6) { // Limit pages to avoid infinite loops
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

    }, []);


    useEffect(() => {
        updateDateRangeProperty();
        fetchAllResults(searchResults);
    }, [searchResults, fetchAllResults, updateDateRangeProperty]);

    useEffect(() => {
        if (!isInitialized) {
            const moetedato = getProperty('moetedato');
            if (moetedato) {
                const dateMatch = moetedato.match(/(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})/);
                if (dateMatch) {
                    const [, startDateStr] = dateMatch;
                    const parsedDate = new Date(startDateStr);
                    if (!Number.isNaN(parsedDate.getTime())) {
                        setSelectedDate(parsedDate);
                    }
                }
            }
            setIsInitialized(true);
        }
    }, [isInitialized, getProperty]);




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
                        currentSearchResults={allResults} />
                </div>
            </div>

            {/* <div className="container-post collapsible" /> */}
        </div>
    );
}


//TODO: Fix display of many meetings on same day
//TODO: Automatically display weekend if there are meetings on weekend days
//TODO: Loading state while fetching all results
//TODO: Utilize full page width for calendar
//TODO: Implement dynamic view 
//TODO: Order meetings by time 
//TODO: Remove date filter when leaving moetekalender
//TODO: Fix duplicate run of fetchAllResults
//TODO: Move files to correct spots
//TODO: Fix bug, month changes on refresh