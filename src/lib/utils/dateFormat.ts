import {
  getIntlLocale,
  getTranslateFunction,
  type LanguageCode,
} from '~/lib/translation/translation';

export const NORWEGIAN_TIME_ZONE = 'Europe/Oslo';
const DAY_MS = 24 * 60 * 60 * 1000;

/** "03.11.2026", in Norwegian time wherever it is read. */
export function dateFormat(
  timestamp: string | number,
  languageCode: LanguageCode,
) {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: NORWEGIAN_TIME_ZONE,
  };

  return new Intl.DateTimeFormat(getIntlLocale(languageCode), options).format(
    date,
  );
}

/** The day in Norway, `YYYY-MM-DD`. */
export function getNorwegianDate(timestamp: string | number): string {
  // en-CA writes dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: NORWEGIAN_TIME_ZONE,
  }).format(new Date(timestamp));
}

/** "10:30", in Norwegian time wherever it is read. */
export function timeFormat(
  timestamp: string | number,
  languageCode: LanguageCode,
) {
  return new Intl.DateTimeFormat(getIntlLocale(languageCode), {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: NORWEGIAN_TIME_ZONE,
  }).format(new Date(timestamp));
}

/** "I dag", "Om 3 dager" or "For 3 dager siden", by the Norwegian calendar. */
export function relativeDateFormat(
  timestamp: string | number,
  languageCode: LanguageCode,
  now: number = Date.now(),
) {
  const t = getTranslateFunction(languageCode);
  const days = Math.round(
    (Date.parse(getNorwegianDate(timestamp)) -
      Date.parse(getNorwegianDate(now))) /
      DAY_MS,
  );

  if (days === 0) {
    return t('common.today');
  }
  if (days === 1) {
    return t('common.tomorrow');
  }
  if (days === -1) {
    return t('common.yesterday');
  }
  return days > 0
    ? t('common.inDays', String(days))
    : t('common.daysAgo', String(-days));
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
