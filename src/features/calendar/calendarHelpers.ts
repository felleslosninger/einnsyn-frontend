// URL query keys owned by the calendar
export const SELECTED_VIEW_KEY = 'view';
export const SELECTED_DATE_KEY = 'date';
export const SELECTED_WEEKEND_TOGGLE_KEY = 'weekends';

export type CalendarView = 'day' | 'week' | 'month';
export type DateRange = { from: string; to: string };

const isCalendarView = (value: string | null): value is CalendarView =>
  value === 'day' || value === 'week' || value === 'month';

// Parse YYYY-MM-DD as local time (not UTC) so calendar cells don't drift
// across day boundaries in negative UTC offsets.
const parseLocalDate = (value: string | null): Date | undefined => {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const toDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getSelectedCalendarDate = (params: URLSearchParams): Date =>
  parseLocalDate(params.get(SELECTED_DATE_KEY)) ?? new Date();

export const getSelectedCalendarView = (
  params: URLSearchParams,
): CalendarView => {
  const value = params.get(SELECTED_VIEW_KEY);
  return isCalendarView(value) ? value : 'month';
};

export const getSelectedWeekendToggle = (params: URLSearchParams): boolean =>
  params.get(SELECTED_WEEKEND_TOGGLE_KEY) === 'true';

// Date range to fetch given the current view. Month view widens to
// prev + current + next so scrolling into an adjacent month lands on
// pre-loaded data.
export const getDateRange = (
  selectedDate: Date,
  view: CalendarView,
): DateRange => {
  const y = selectedDate.getFullYear();
  const m = selectedDate.getMonth();
  const d = selectedDate.getDate();

  let start: Date;
  let end: Date;
  switch (view) {
    case 'month':
      start = new Date(y, m - 1, 1);
      end = new Date(y, m + 2, 0);
      break;
    case 'week': {
      const dayOfWeek = selectedDate.getDay();
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start = new Date(y, m, d - mondayOffset);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      break;
    }
    case 'day':
      start = new Date(y, m, d);
      end = new Date(y, m, d);
      break;
  }
  return { from: toDateString(start), to: toDateString(end) };
};

export const resolveCalendarDateRange = (params: URLSearchParams): DateRange =>
  getDateRange(
    getSelectedCalendarDate(params),
    getSelectedCalendarView(params),
  );

// ISO 8601 week number.
export const getIsoWeekNumber = (date: Date): number => {
  const t = new Date(date);
  t.setHours(0, 0, 0, 0);
  // Move to the Thursday of the current week (ISO weeks are Mon–Sun and
  // "own" the year that contains their Thursday).
  t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7));
  const week1 = new Date(t.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((t.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
};
