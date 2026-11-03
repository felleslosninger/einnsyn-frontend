import assert from 'node:assert';
import { describe, test } from 'node:test';

import { getNorwegianDate, meetingDateFormat } from './dateFormat';

describe('getNorwegianDate', () => {
  test('turns at midnight in Norway, in winter and summer time', () => {
    assert.equal(getNorwegianDate('2026-11-03T22:59:59Z'), '2026-11-03');
    assert.equal(getNorwegianDate('2026-11-03T23:00:00Z'), '2026-11-04');
    assert.equal(getNorwegianDate('2026-06-30T21:59:59Z'), '2026-06-30');
    assert.equal(getNorwegianDate('2026-06-30T22:00:00Z'), '2026-07-01');
  });
});

describe('meetingDateFormat', () => {
  const now = Date.parse('2026-11-03T22:30:00Z'); // 23:30 in Norway

  test('formats the date and time in Norwegian time', () => {
    const { date, time } = meetingDateFormat('2026-11-03T09:30:00Z', 'en', now);

    assert.equal(date, 'Tue 3 Nov');
    assert.equal(time, '10:30');
  });

  test('counts days by the Norwegian calendar', () => {
    const fromToday = (iso: string) =>
      meetingDateFormat(iso, 'en', now).fromToday;

    assert.equal(fromToday('2026-11-03T07:00:00Z'), 'today');
    assert.equal(fromToday('2026-11-03T23:30:00Z'), 'tomorrow');
  });

  test('says days for two weeks, then weeks, then months', () => {
    const fromToday = (iso: string) =>
      meetingDateFormat(iso, 'en', now).fromToday;

    assert.equal(fromToday('2026-11-17T12:00:00Z'), 'in 14 days');
    assert.equal(fromToday('2026-11-18T12:00:00Z'), 'in 2 weeks');
    assert.equal(fromToday('2027-01-02T12:00:00Z'), 'in 2 months');
  });
});
