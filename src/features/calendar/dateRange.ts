export function getDateRange(selectedDate: Date, view: string) {
  const start = new Date(selectedDate);
  const end = new Date(selectedDate);

  switch (view) {
    case 'month': {
      const dayOfWeek = start.getDay();
      const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(start.getDate() - mondayBasedDay);
      end.setDate(start.getDate() + 28);
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
