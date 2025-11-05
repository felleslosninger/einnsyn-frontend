'use client';
import { useEffect, useState, useCallback } from 'react';
import type { PaginatedList, Base } from '@digdir/einnsyn-sdk';

import { isMoetemappe } from '@digdir/einnsyn-sdk';
import { fetchNextPage } from '~/lib/utils/pagination';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';

import CalendarHeader from './CalendarHeader';
import CalendarBody from './CalendarBody';
import MoetemappeModule from './Moetemappe';

export default function CalendarContainer({
    searchResults
}: {
    searchResults: PaginatedList<Base>;
}) {
    const [currentSearchResults, setCurrentSearchResults] =
        useState<PaginatedList<Base>>(searchResults);

    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const fetchAllResults = useCallback(async (initialResults: PaginatedList<Base>) => {
        let allResults = initialResults;

        if (initialResults.next) {
            setIsLoadingMore(true);
            while (allResults.next) {
                try {
                    const nextPage = await fetchNextPage(allResults);
                    allResults = nextPage;
                    setCurrentSearchResults(nextPage);
                } catch (error) {
                    console.error('Error fetching more results:', error);
                    break;
                }
            }
            setIsLoadingMore(false);
        }
    }, []);


    // Update currentSearchResults when searchResults prop changes (new search)
    useEffect(() => {
        setCurrentSearchResults(searchResults);
        if (searchResults.next) {
            fetchAllResults(searchResults);
        }
    }, [searchResults, fetchAllResults]);


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

// TODO: only fetch resutls for displayed date range