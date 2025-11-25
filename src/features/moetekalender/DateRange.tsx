export function getDateRange(selectedDate: Date, view: string) {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    switch (view) {
        case 'month': {
            const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            start.setTime(firstDayOfMonth.getTime());
            const dayOfWeek = firstDayOfMonth.getDay();
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            start.setDate(firstDayOfMonth.getDate() - daysToSubtract);

            const current = new Date(start);
            const weeksToShow = 6;

            for (let week = 0; week < weeksToShow; week++) {
                for (let day = 0; day < 7; day++) {
                    current.setDate(current.getDate() + 1);
                }

            }

            end.setTime(current.getTime());
            end.setDate(end.getDate() - 1);

            break;
        }
        case 'week': {
            const dayOfWeek = start.getDay();
            const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            start.setDate(start.getDate() - mondayBasedDay);
            end.setDate(start.getDate() + 6);
            break;
        }
        case 'day':
            break;
        default:
            break;
    }

    return { start, end };
};