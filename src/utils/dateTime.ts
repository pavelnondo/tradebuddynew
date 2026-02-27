/**
 * Format Date to local datetime string for datetime-local input
 * Format: YYYY-MM-DDTHH:mm
 */
export function toLocalDatetimeString(d: Date | null | undefined): string {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Parse datetime-local string to Date (interpreted as local time)
 */
export function parseLocalDatetimeString(s: string | null | undefined): Date | null {
  if (!s || typeof s !== 'string') return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
