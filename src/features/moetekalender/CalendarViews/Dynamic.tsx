import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';

import styles from '../CalendarContainer.module.scss';

import type { PaginatedList, Base } from '@digdir/einnsyn-sdk';

export default function DynamicView({ selectedDate, displayWeekends, currentSearchResults }: { selectedDate: Date; displayWeekends: boolean, currentSearchResults: PaginatedList<Base> }) {
    const t = useTranslation();

    function generateCalenderGrid() {
        // Implementation for generating a dynamic calendar grid
        // Calendar should display 3 weeks at a time
        // When scrolling replace shown weeks with next/previous weeks
        // Ensure weekends are displayed based on displayWeekends prop
        // sizes of cells should be adjustable, and overflow should be hidden
        // pages? to view more meetings in a cell?
        // 
    }

    return (
        <>

        </>
    );
}