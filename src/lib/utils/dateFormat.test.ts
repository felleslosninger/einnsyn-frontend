import assert from 'node:assert';
import { describe, test } from 'node:test';

import {
  dateFormat,
  getNorwegianDate,
  relativeDateFormat,
  timeFormat,
} from './dateFormat';

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
