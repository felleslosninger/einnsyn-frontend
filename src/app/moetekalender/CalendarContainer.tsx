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
    const [isLoadingAll, setIsLoadingAll] = useState(false);

    const fetchAllResults = useCallback(async (initialResults: PaginatedList<Base>) => {
        setIsLoadingAll(true);
        let currentResults = initialResults;

        while (currentResults.next) {
            try {
                currentResults = await fetchNextPage(currentResults, true);
            } catch (error) {
                console.error('Error fetching next page:', error);
                break;
            }
        }

        setAllResults(currentResults);
        setIsLoadingAll(false);
    }, []);

    useEffect(() => {
        fetchAllResults(searchResults);
    }, [searchResults, fetchAllResults]);

    const currentDateRange = useMemo(() => {
        return getDateRange(selectedDate, selectedView);
    }, [selectedDate, selectedView]);

    const updateDateRangeProperty = useCallback(() => {
        const startDate = formatDateForUrl(currentDateRange.start);
        const endDate = formatDateForUrl(currentDateRange.end);
        const dateRangeQuery = `${startDate}/${endDate}`;

        setProperty('moetedato', dateRangeQuery);
    }, [currentDateRange, setProperty]);

    useEffect(() => {
        updateDateRangeProperty();
    }, [updateDateRangeProperty]);

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
    }, [isInitialized, getProperty]); //only run on mount 

    // useEffect(() => {
    //     if (!isInitialized) {
    //         const entity = getProperty('entity');
    //         if (!entity) {
    //             setProperty('entity', 'Moetemappe', false);
    //         }
    //     }
    //     setIsInitialized(true);
    // }, [isInitialized, getProperty, setProperty]); // Only run on mount

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
                    currentSearchResults={allResults} />
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
//TODO: Fix arrow nav for week and day views