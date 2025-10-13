// backend/src/utils/date-only.ts
export const toISODate = (d: Date | string): string => {
  if (!d) return '';
  if (typeof d === 'string') {
    // si ya viene 'YYYY-MM-DD' o ISO con hora, recorta
    return d.length >= 10 ? d.slice(0, 10) : d;
  }
  // Date -> 'YYYY-MM-DD' sin corrimiento de huso
  const tzless = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tzless.toISOString().slice(0, 10);
};

export const daysAgoISO = (days: number): string => {
  const ms = days * 24 * 60 * 60 * 1000;
  const d = new Date(Date.now() - ms);
  const tzless = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tzless.toISOString().slice(0, 10);
};
