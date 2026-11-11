import assert from 'node:assert';
import { describe, test } from 'node:test';

import {
  getTranslateFunction,
  supportedLanguages,
} from '~/lib/translation/translation';
import {
  dateFormat,
  getNorwegianDate,
  monthFormat,
  relativeDateFormat,
  timeFormat,
  weekdayDateFormat,
} from './dateFormat';

test('every language names every month and weekday', () => {
  for (const languageCode of supportedLanguages) {
    const t = getTranslateFunction(languageCode);
    for (const [names, count] of [
      ['date.months', 12],
      ['date.monthsShort', 12],
      ['date.weekdays', 7],
    ] as const) {
      for (let i = 1; i <= count; i++) {
        const key = `${names}.${i}`;
        assert.notEqual(t(key), key, `${languageCode} lacks ${key}`);
      }
    }
  }
});

describe('weekdayDateFormat', () => {
  test('names the day in each language', () => {
    const saturday = '2026-11-07T12:00:00Z';
    assert.equal(weekdayDateFormat(saturday, 'nb'), 'lørdag 7. november');
    assert.equal(weekdayDateFormat(saturday, 'nn'), 'laurdag 7. november');
    assert.equal(weekdayDateFormat(saturday, 'en'), 'Saturday 7 November');
    assert.equal(weekdayDateFormat(saturday, 'se'), 'lávvardat 7. skábmamánnu');
  });

  test('uses the Norwegian day', () => {
    assert.equal(
      weekdayDateFormat('2026-11-07T23:30:00Z', 'nb'),
      'søndag 8. november',
    );
    assert.equal(
      weekdayDateFormat('2026-12-31T23:30:00Z', 'en'),
      'Friday 1 January',
    );
  });
});

test('monthFormat uses the UTC month', () => {
  assert.equal(monthFormat('2025-11-30T23:30:00Z', 'nb'), 'nov. 2025');
  assert.equal(
    monthFormat('2025-12-01T00:00:00Z', 'nn', 'long'),
    'desember 2025',
  );
  assert.equal(monthFormat('2025-09-15T00:00:00Z', 'en'), 'Sept 2025');
});

describe('getNorwegianDate', () => {
  test('turns at midnight in Norway, in winter and summer time', () => {
    assert.equal(getNorwegianDate('2026-11-03T22:59:59Z'), '2026-11-03');
    assert.equal(getNorwegianDate('2026-11-03T23:00:00Z'), '2026-11-04');
    assert.equal(getNorwegianDate('2026-06-30T21:59:59Z'), '2026-06-30');
    assert.equal(getNorwegianDate('2026-06-30T22:00:00Z'), '2026-07-01');
  });
});

test('the formats use Norwegian time', () => {
  assert.equal(dateFormat('2026-11-03T23:30:00Z', 'nb'), '04.11.2026');
  assert.equal(timeFormat('2026-11-03T09:30:00Z', 'en'), '10:30');
});

describe('relativeDateFormat', () => {
  const now = Date.parse('2026-11-03T22:30:00Z'); // 23:30 in Norway

  test('counts days by the Norwegian calendar', () => {
    const format = (iso: string) => relativeDateFormat(iso, 'en', now);

    assert.equal(format('2026-11-03T07:00:00Z'), 'Today');
    assert.equal(format('2026-11-03T23:30:00Z'), 'Tomorrow');
    assert.equal(format('2027-01-02T12:00:00Z'), 'In 60 days');
    assert.equal(format('2026-11-01T23:30:00Z'), 'Yesterday');
    assert.equal(format('2026-10-31T12:00:00Z'), '3 days ago');
  });
});
