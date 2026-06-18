import { describe, it, expect } from 'vitest';
import { fmtIDR, fmtIDRShort } from './formatCurrency';

describe('fmtIDR', () => {
  it('formats zero', () => {
    expect(fmtIDR(0)).toBe('Rp 0');
  });

  it('formats thousands with id-ID locale separator', () => {
    expect(fmtIDR(50000)).toMatch(/Rp\s50[.,]000/);
  });

  it('formats a typical order total', () => {
    expect(fmtIDR(164450)).toMatch(/Rp\s164[.,]450/);
  });
});

describe('fmtIDRShort', () => {
  it('formats below 1K as plain Rp', () => {
    expect(fmtIDRShort(500)).toBe('Rp 500');
  });

  it('formats thousands as K', () => {
    expect(fmtIDRShort(50000)).toBe('Rp 50K');
  });

  it('formats millions as M', () => {
    expect(fmtIDRShort(4_200_000)).toBe('Rp 4.2M');
  });

  it('formats exactly 1M as M', () => {
    expect(fmtIDRShort(1_000_000)).toBe('Rp 1.0M');
  });
});
