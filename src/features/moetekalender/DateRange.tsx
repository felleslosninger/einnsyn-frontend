export function getDateRange(selectedDate: Date, view: string) {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    switch (view) {
        case 'dynamic': {
            const dayOfWeek = start.getDay();
            const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            start.setDate(start.getDate() - mondayBasedDay);
            end.setDate(start.getDate() + 40);
            break;
        }
        case 'month': {
            const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            start.setDate(firstDayOfMonth.getDate());
            const dayOfWeek = firstDayOfMonth.getDay();
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            start.setDate(firstDayOfMonth.getDate() - daysToSubtract);

            end.setDate(start.getDate());
            end.setDate(end.getDate() + 41);

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