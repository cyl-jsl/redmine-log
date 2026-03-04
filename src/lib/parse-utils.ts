export function localDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseHours(input: string): number {
  let hours: number;
  if (input.endsWith('m')) {
    hours = Number(input.slice(0, -1)) / 60;
  } else {
    hours = Number(input.endsWith('h') ? input.slice(0, -1) : input);
  }
  if (isNaN(hours) || hours <= 0) throw new Error(`Invalid hours: ${input}`);
  return Math.round(hours * 100) / 100;
}

export function parseDate(input?: string): string {
  if (!input || input === 'today') return localDateStr(new Date());
  if (input === 'yesterday') {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return localDateStr(d);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  // MM/DD format → current year
  const mmdd = input.match(/^(\d{2})\/(\d{2})$/);
  if (mmdd) {
    const year = new Date().getFullYear();
    return `${year}-${mmdd[1]}-${mmdd[2]}`;
  }
  throw new Error(`Invalid date: ${input}. Use YYYY-MM-DD, MM/DD, "today", or "yesterday".`);
}
