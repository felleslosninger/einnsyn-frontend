import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { getMeetingCalendarHref } from './getMeetingCalendarHref';

test('creates a calendar file with the meeting title, date, time, and place', () => {
  const meeting = {
    offentligTittel: 'Board meeting',
    moetedato: '2026-10-15T09:30:00+02:00',
    moetested: 'City hall',
  } as Moetemappe;

  const href = getMeetingCalendarHref(meeting);

  assert.ok(href?.startsWith('data:text/calendar;charset=utf-8,'));
  const calendar = decodeURIComponent(href.slice(href.indexOf(',') + 1));
  assert.match(calendar, /SUMMARY:Board meeting/);
  assert.match(calendar, /DTSTART:20261015T073000Z/);
  assert.match(calendar, /LOCATION:City hall/);
});

test('does not create a calendar file when the meeting date is invalid', () => {
  const meeting = {
    offentligTittel: 'Board meeting',
    moetedato: 'not a date',
  } as Moetemappe;

  assert.strictEqual(getMeetingCalendarHref(meeting), undefined);
});