import { describe, it, expect } from 'vitest';
import { fmtElapsed } from './formatTime';

describe('fmtElapsed', () => {
  it('formats zero seconds', () => {
    expect(fmtElapsed(0)).toBe('0:00');
  });

  it('formats seconds under a minute', () => {
    expect(fmtElapsed(45)).toBe('0:45');
  });

  it('formats exactly one minute', () => {
    expect(fmtElapsed(60)).toBe('1:00');
  });

  it('pads single-digit seconds', () => {
    expect(fmtElapsed(65)).toBe('1:05');
  });

  it('formats 10 minutes', () => {
    expect(fmtElapsed(600)).toBe('10:00');
  });
});
