import {
  getIntlLocale,
  type LanguageCode,
} from '~/lib/translation/translation';

export function dateFormat(
  timestamp: string | number,
  languageCode: LanguageCode,
) {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  return new Intl.DateTimeFormat(getIntlLocale(languageCode), options).format(
    date,
  );
}

const NORWEGIAN_TIME_ZONE = 'Europe/Oslo';
const DAY_MS = 24 * 60 * 60 * 1000;

/** The day in Norway, `YYYY-MM-DD`. */
export function getNorwegianDate(timestamp: string | number): string {
  // en-CA writes dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: NORWEGIAN_TIME_ZONE,
  }).format(new Date(timestamp));
}

/**
 * A meeting's date ("tir. 3. nov."), time ("10:30") and how many days off it
 * is ("i dag", "om 8 døgn", "om 3 uker"), in Norwegian time wherever it is
 * read, as the meetings are held there.
 */
export function meetingDateFormat(
  timestamp: string | number,
  languageCode: LanguageCode,
  now: number = Date.now(),
) {
  const locale = getIntlLocale(languageCode);
  const date = new Date(timestamp);
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, {
      ...options,
      timeZone: NORWEGIAN_TIME_ZONE,
    }).format(date);
  const days = Math.round(
    (Date.parse(getNorwegianDate(timestamp)) -
      Date.parse(getNorwegianDate(now))) /
      DAY_MS,
  );
  // `auto` says "i dag" and "i morgen" instead of "om 0 døgn" and "om 1 døgn".
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  return {
    date: format({ weekday: 'short', day: 'numeric', month: 'short' }),
    time: format({ hour: '2-digit', minute: '2-digit' }),
    fromToday:
      days <= 14
        ? relative.format(days, 'day')
        : days < 60
          ? relative.format(Math.round(days / 7), 'week')
          : relative.format(Math.round(days / 30), 'month'),
  };
}

// A chart labels every point on each render, and a formatter is costly to build.
const monthFormats = new Map<string, Intl.DateTimeFormat>();

/** "nov. 2025" or "november 2025", in UTC like the API's monthly buckets. */
export function monthFormat(
  timestamp: string | number,
  languageCode: LanguageCode,
  month: 'short' | 'long' = 'short',
) {
  const locale = getIntlLocale(languageCode);
  const key = `${locale}|${month}`;
  let format = monthFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month,
      timeZone: 'UTC',
    });
    monthFormats.set(key, format);
  }
  return format.format(new Date(timestamp));
}
