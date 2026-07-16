import {
  formatDateOnly,
  formatSequence,
  getSequenceParts,
  parseDateOnly,
} from './sequence.util';

describe('sequence.util', () => {
  it('parses date-only as UTC and builds STK format', () => {
    // 2026-07-13 = Senin
    const d = parseDateOnly('2026-07-13');
    const parts = getSequenceParts(d);
    expect(parts.dayName).toBe('Senin');
    expect(parts.romanMonth).toBe('VII');
    expect(parts.year).toBe(2026);
    expect(formatSequence(parts, 1)).toBe('STK/Senin/VII/2026/00001');
    expect(formatDateOnly(d)).toBe('2026-07-13');
  });
});
