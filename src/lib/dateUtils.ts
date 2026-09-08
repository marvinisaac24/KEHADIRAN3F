export interface ParsedDate {
  day: number;
  month: number;
  year: number;
}

/**
 * Parses various date formats commonly found in absences:
 * - YYYY-MM-DD (e.g. from HTML date picker: "2026-09-08")
 * - DD/MM/YYYY or D/M/YYYY (e.g. from CSV or display: "08/09/2026")
 * - ISO string timestamps (e.g. "2026-09-08T08:30:00.000Z")
 */
export function parseAbsenceDate(dateStr: string | any): ParsedDate | null {
  if (!dateStr) return null;
  if (typeof dateStr !== 'string') {
    if (dateStr instanceof Date && !isNaN(dateStr.getTime())) {
      return {
        day: dateStr.getDate(),
        month: dateStr.getMonth() + 1,
        year: dateStr.getFullYear(),
      };
    }
    return null;
  }

  const clean = dateStr.trim();

  // Pattern YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(clean)) {
    const parts = clean.split(/[-/T ]/);
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return { year: y, month: m, day: d };
    }
  }

  // Pattern DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(clean)) {
    const parts = clean.split(/[-/ ]/);
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return { year: y, month: m, day: d };
    }
  }

  // Fallback to standard Date constructor
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return {
      day: parsed.getDate(),
      month: parsed.getMonth() + 1,
      year: parsed.getFullYear(),
    };
  }

  return null;
}

export function formatAbsenceDate(dateStr: string | any): string {
  const parsed = parseAbsenceDate(dateStr);
  if (!parsed) return typeof dateStr === 'string' ? dateStr : '-';
  const dd = String(parsed.day).padStart(2, '0');
  const mm = String(parsed.month).padStart(2, '0');
  return `${dd}/${mm}/${parsed.year}`;
}

export function formatDateTime(isoOrDate: string | any): string {
  if (!isoOrDate) return '-';
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return String(isoOrDate);
    return d.toLocaleString('ms-MY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(isoOrDate);
  }
}
