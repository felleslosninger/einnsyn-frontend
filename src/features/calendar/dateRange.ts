export function getDateRange(selectedDate: Date, view: string) {
  const start = new Date(selectedDate);
  const end = new Date(selectedDate);

  switch (view) {
    case 'month': {
      // Fetch prev + current + next month so lead-in/lead-out cells have
      // data and adjacent-month scrolls land on pre-loaded results.
      const y = selectedDate.getFullYear();
      const m = selectedDate.getMonth();
      start.setTime(new Date(y, m - 1, 1).getTime());
      end.setTime(new Date(y, m + 2, 0).getTime());
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
}
