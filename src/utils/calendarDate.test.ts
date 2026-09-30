import { describe, expect, it } from 'vitest';
import { formatAccountingPeriod, formatCalendarDate } from './calendarDate';

describe('calendar-only values from account statements', () => {
  it('preserves the calendar day and month without interpreting midnight as a timezone timestamp', () => {
    expect(formatCalendarDate('2026-09-30')).toBe('30/09/2026');
    expect(formatAccountingPeriod('2026-09-01')).toBe('septiembre de 2026');
  });

  it('does not invent a date for invalid values', () => {
    expect(formatCalendarDate('2026-02-30')).toBe('2026-02-30');
    expect(formatAccountingPeriod('invalid')).toBe('invalid');
  });
});
