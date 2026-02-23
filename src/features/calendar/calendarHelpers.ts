import { searchQueryToTokens } from '~/lib/utils/searchStringTokenizer';
import { getDateRange } from './dateRange';

export const SELECTED_VIEW_KEY = 'view';
export const SELECTED_DATE_KEY = 'date';
export const SELECTED_WEEKEND_TOGGLE_KEY = 'weekends';
const LEGACY_SELECTED_VIEW_KEY = 'cv';
const LEGACY_SELECTED_DATE_KEY = 'cd';

export type CalendarView = 'day' | 'week' | 'month';

export type DateRange = {
  from: string;
  to: string;
};

export const isCalendarView = (
  value: string | null | undefined,
): value is CalendarView => {
  return (
    value === 'day' ||
    value === 'week' ||
    value === 'month'
  );
};

const toDateOrUndefined = (value: string | null | undefined) => {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
};

/**
 * Return a date-string from a Date object
 * @param date
 * @returns
 */
export const toDateString = (date: Date) => {
  return date.toISOString().split('T')[0];
};

/**
 *
 * @param searchParams
 * @returns
 */
export const getSelectedCalendarDate = (
  searchParams: URLSearchParams,
): Date => {
  // First priority, explicit date query parameter
  const fromQuery =
    searchParams.get(SELECTED_DATE_KEY) ??
    searchParams.get(LEGACY_SELECTED_DATE_KEY);
  const explicitDate = toDateOrUndefined(fromQuery);
  if (explicitDate) {
    return explicitDate;
  }

  // Second priority, look for 'moetedato' in the 'q' parameter
  const query = searchParams.get('q') ?? '';
  const moetedato = searchQueryToTokens(query).find(
    (token) => token.prefix === 'moetedato',
  );
  const [from, to] = moetedato?.value.split('/') ?? [];
  const fromDate = toDateOrUndefined(from);
  const toDate = toDateOrUndefined(to);
  if (fromDate && toDate) {
    const middleTime = (fromDate.getTime() + toDate.getTime()) / 2;
    return new Date(middleTime);
  }
  if (fromDate) {
    return fromDate;
  }
  if (toDate) {
    return toDate;
  }

  // Fallback to current date
  return new Date();
};

export const getSelectedCalendarView = (
  searchParams: URLSearchParams,
): CalendarView => {
  // First priority, explicit view query parameter
  const viewFromQuery =
    searchParams.get(SELECTED_VIEW_KEY) ??
    searchParams.get(LEGACY_SELECTED_VIEW_KEY);
  if (isCalendarView(viewFromQuery)) {
    return viewFromQuery;
  }

  // Fall back to 'month' view
  return 'month';
};

/**
 * Resolve calendar date range from search params.
 * Falls back to the current view's default range when `moetedato` is missing or invalid.
 */
export const resolveCalendarDateRange = (
  searchParams: URLSearchParams,
): DateRange => {
  const selectedDate = getSelectedCalendarDate(searchParams);
  const view = getSelectedCalendarView(searchParams);
  const dateRange = getDateRange(selectedDate, view);
  return {
    from: toDateString(dateRange.start),
    to: toDateString(dateRange.end),
  };
};


export const getSelectedWeekendToggle = (
  searchParams: URLSearchParams,
): boolean => {
  const value = searchParams.get(SELECTED_WEEKEND_TOGGLE_KEY);
  // Default to false if not set, return true only if explicitly 'true'
  return value === 'true';
};