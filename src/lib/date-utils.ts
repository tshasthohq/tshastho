// src/lib/date-utils.ts
export function getDhakaDateRanges(period: string, customStartStr?: string | null, customEndStr?: string | null) {
  const timeZone = 'Asia/Dhaka';
  const now = new Date();

  // Helper: YYYY-MM-DD in Dhaka
  const getDhakaDateString = (d: Date) => 
    new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

  const todayStr = getDhakaDateString(now);
  const todayStart = new Date(`${todayStr}T00:00:00+06:00`);
  
  // Yesterday
  const yesterdayDate = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStart = new Date(`${getDhakaDateString(yesterdayDate)}T00:00:00+06:00`);
  const yesterdayEnd = new Date(todayStart.getTime() - 1);

  // Week Start (Saturday)
  const todayDhaka = new Date(`${todayStr}T12:00:00+06:00`);
  const dayOfWeek = todayDhaka.getUTCDay(); // 0=Sun, 6=Sat
  const diffToSat = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
  const weekStart = new Date(todayStart.getTime() - diffToSat * 24 * 60 * 60 * 1000);

  // Month Start
  const monthStartStr = todayStr.substring(0, 7) + '-01';
  const monthStart = new Date(`${monthStartStr}T00:00:00+06:00`);

  // Year Start
  const yearStartStr = todayStr.substring(0, 4) + '-01-01';
  const yearStart = new Date(`${yearStartStr}T00:00:00+06:00`);

  // Custom Dates
  let customStart, customEnd;
  if (customStartStr && customEndStr) {
    customStart = new Date(`${customStartStr}T00:00:00+06:00`);
    customEnd = new Date(`${customEndStr}T23:59:59.999+06:00`);
  }

  return { todayStart, yesterdayStart, yesterdayEnd, weekStart, monthStart, yearStart, customStart, customEnd };
}

export function getDhakaDateStringForNumber(date: Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date).replace(/-/g, '');
}
