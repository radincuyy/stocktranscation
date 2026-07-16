const DAY_ID = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

const ROMAN_MONTH = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
] as const;

export type SequenceParts = {
  dayName: string;
  romanMonth: string;
  year: number;
  /** kunci sequence_counters, contoh: Senin-VII-2026 */
  counterKey: string;
};

export function getSequenceParts(date: Date): SequenceParts {
  // Selalu pakai komponen kalender UTC (tanggal disimpan sebagai UTC midnight)
  const dayName = DAY_ID[date.getUTCDay()];
  const romanMonth = ROMAN_MONTH[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return {
    dayName,
    romanMonth,
    year,
    counterKey: `${dayName}-${romanMonth}-${year}`,
  };
}

export function formatSequence(
  parts: SequenceParts,
  runningNumber: number,
): string {
  const run = String(runningNumber).padStart(5, '0');
  return `STK/${parts.dayName}/${parts.romanMonth}/${parts.year}/${run}`;
}

export function parseDateOnly(value: string): Date {
  // Terima YYYY-MM-DD → UTC midnight (stabil lintas timezone)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) {
    throw new Error('Date must be YYYY-MM-DD');
  }
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(Date.UTC(year, month, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month ||
    d.getUTCDate() !== day
  ) {
    throw new Error('Invalid calendar date');
  }
  return d;
}

/** Format tanggal DB menjadi YYYY-MM-DD tanpa pergeseran timezone. */
export function formatDateOnly(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
