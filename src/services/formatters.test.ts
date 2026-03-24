import { describe, it, expect } from 'vitest';
import { formatPace, formatTime, formatTimeMinSec, parsePace, parseTimeHMS } from './formatters';

describe('formatPace', () => {
  it('formats whole minutes correctly', () => {
    expect(formatPace(300)).toBe('5:00');
  });

  it('formats minutes and seconds correctly', () => {
    expect(formatPace(330)).toBe('5:30');
  });

  it('pads single-digit seconds with zero', () => {
    expect(formatPace(305)).toBe('5:05');
  });

  it('rounds to nearest second', () => {
    expect(formatPace(330.6)).toBe('5:31');
  });

  it('returns --:-- for zero', () => {
    expect(formatPace(0)).toBe('--:--');
  });

  it('returns --:-- for negative value', () => {
    expect(formatPace(-10)).toBe('--:--');
  });

  it('returns --:-- for Infinity', () => {
    expect(formatPace(Infinity)).toBe('--:--');
  });

  it('returns --:-- for NaN', () => {
    expect(formatPace(NaN)).toBe('--:--');
  });
});

describe('formatTime', () => {
  it('formats hours, minutes, seconds', () => {
    expect(formatTime(3723)).toBe('1:02:03');
  });

  it('formats zero as 0:00:00', () => {
    expect(formatTime(0)).toBe('0:00:00');
  });

  it('pads minutes and seconds', () => {
    expect(formatTime(3661)).toBe('1:01:01');
  });

  it('returns --:--:-- for negative value', () => {
    expect(formatTime(-1)).toBe('--:--:--');
  });

  it('returns --:--:-- for NaN', () => {
    expect(formatTime(NaN)).toBe('--:--:--');
  });
});

describe('formatTimeMinSec', () => {
  it('formats minutes and seconds', () => {
    expect(formatTimeMinSec(90)).toBe('1:30');
  });

  it('pads single-digit seconds', () => {
    expect(formatTimeMinSec(65)).toBe('1:05');
  });

  it('returns --:-- for negative value', () => {
    expect(formatTimeMinSec(-5)).toBe('--:--');
  });
});

describe('parsePace', () => {
  it('parses valid pace string', () => {
    expect(parsePace('5:30')).toBe(330);
  });

  it('parses pace with zero seconds', () => {
    expect(parsePace('6:00')).toBe(360);
  });

  it('returns null for invalid format', () => {
    expect(parsePace('530')).toBeNull();
    expect(parsePace('5:3')).toBeNull();
    expect(parsePace('')).toBeNull();
  });

  it('returns null for seconds >= 60', () => {
    expect(parsePace('5:60')).toBeNull();
    expect(parsePace('5:99')).toBeNull();
  });
});

describe('parseTimeHMS', () => {
  it('parses valid h:mm:ss string', () => {
    expect(parseTimeHMS('1:02:03')).toBe(3723);
  });

  it('parses zero time', () => {
    expect(parseTimeHMS('0:00:00')).toBe(0);
  });

  it('returns null for invalid format', () => {
    expect(parseTimeHMS('1:30')).toBeNull();
    expect(parseTimeHMS('')).toBeNull();
  });

  it('returns null for minutes >= 60', () => {
    expect(parseTimeHMS('1:60:00')).toBeNull();
  });

  it('returns null for seconds >= 60', () => {
    expect(parseTimeHMS('1:00:60')).toBeNull();
  });
});
