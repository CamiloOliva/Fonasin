const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function utcCalendarDate(value: string): Date | null {
  const match = calendarDatePattern.exec(value);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10) === value ? date : null;
}

export function formatCalendarDate(value: string): string {
  const date = utcCalendarDate(value);
  return date
    ? new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(date)
    : value;
}

export function formatAccountingPeriod(value: string): string {
  const date = utcCalendarDate(value);
  return date
    ? new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
    : value;
}
