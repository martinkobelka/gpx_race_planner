import { describe, it, expect } from 'vitest';
import { autoType, manualInputsToSegments, manualInputsToGpxPoints } from './manualSegmentService';
import type { ManualSegmentInput } from '../types/index';

describe('autoType', () => {
  it('returns uphill when slope exceeds threshold', () => {
    expect(autoType(10, 1, 5)).toBe('uphill'); // slope = 10 m/km > 5
  });

  it('returns downhill when slope is below negative threshold', () => {
    expect(autoType(-10, 1, 5)).toBe('downhill'); // slope = -10 m/km < -5
  });

  it('returns flat when slope is within threshold', () => {
    expect(autoType(3, 1, 5)).toBe('flat'); // slope = 3 m/km ≤ 5
  });

  it('returns flat at exactly the threshold boundary', () => {
    expect(autoType(5, 1, 5)).toBe('flat'); // slope = 5 = threshold (not strictly greater)
  });

  it('returns flat for zero elevation change', () => {
    expect(autoType(0, 1, 5)).toBe('flat');
  });

  it('returns flat when length is zero', () => {
    expect(autoType(10, 0, 5)).toBe('flat');
  });
});

const makeInput = (lengthKm: number, elevationChangeM: number, type: 'flat' | 'uphill' | 'downhill' = 'flat'): ManualSegmentInput => ({
  uid: 'test',
  type,
  lengthKm,
  elevationChangeM,
});

describe('manualInputsToSegments', () => {
  it('returns empty array for empty input', () => {
    expect(manualInputsToSegments([])).toEqual([]);
  });

  it('single segment: correct length in meters', () => {
    const segs = manualInputsToSegments([makeInput(2, 0)]);
    expect(segs[0].length).toBe(2000);
  });

  it('single segment: start at 0, end at length', () => {
    const segs = manualInputsToSegments([makeInput(1, 0)]);
    expect(segs[0].startDistance).toBe(0);
    expect(segs[0].endDistance).toBe(1000);
  });

  it('two segments: distances are cumulative', () => {
    const segs = manualInputsToSegments([makeInput(1, 0), makeInput(2, 0)]);
    expect(segs[0].endDistance).toBe(1000);
    expect(segs[1].startDistance).toBe(1000);
    expect(segs[1].endDistance).toBe(3000);
  });

  it('positive elevation change sets elevationGain, no loss', () => {
    const segs = manualInputsToSegments([makeInput(1, 50)]);
    expect(segs[0].elevationGain).toBe(50);
    expect(segs[0].elevationLoss).toBe(0);
  });

  it('negative elevation change sets elevationLoss, no gain', () => {
    const segs = manualInputsToSegments([makeInput(1, -30)]);
    expect(segs[0].elevationGain).toBe(0);
    expect(segs[0].elevationLoss).toBe(30);
  });

  it('avgSlope computed correctly (m/100m = %)', () => {
    // 50 m gain over 1 km = 50 m / 1000 m * 100 = 5 %
    const segs = manualInputsToSegments([makeInput(1, 50)]);
    expect(segs[0].avgSlope).toBeCloseTo(5, 5);
  });

  it('IDs start at 1 and increment', () => {
    const segs = manualInputsToSegments([makeInput(1, 0), makeInput(1, 0)]);
    expect(segs[0].id).toBe(1);
    expect(segs[1].id).toBe(2);
  });

  it('elevations accumulate across segments', () => {
    const segs = manualInputsToSegments([makeInput(1, 10), makeInput(1, -5)]);
    expect(segs[0].startElevation).toBe(0);
    expect(segs[0].endElevation).toBe(10);
    expect(segs[1].startElevation).toBe(10);
    expect(segs[1].endElevation).toBe(5);
  });
});

describe('manualInputsToGpxPoints', () => {
  it('returns empty array for empty input', () => {
    expect(manualInputsToGpxPoints([])).toEqual([]);
  });

  it('single segment produces 2 points', () => {
    const pts = manualInputsToGpxPoints([makeInput(1, 10)]);
    expect(pts).toHaveLength(2);
  });

  it('n segments produce n+1 points', () => {
    const inputs = [makeInput(1, 0), makeInput(1, 0), makeInput(1, 0)];
    const pts = manualInputsToGpxPoints(inputs);
    expect(pts).toHaveLength(4);
  });

  it('first point is at distance 0', () => {
    const pts = manualInputsToGpxPoints([makeInput(1, 0)]);
    expect(pts[0].distance).toBe(0);
  });

  it('distances accumulate correctly', () => {
    const pts = manualInputsToGpxPoints([makeInput(1, 0), makeInput(2, 0)]);
    expect(pts[1].distance).toBe(1000);
    expect(pts[2].distance).toBe(3000);
  });

  it('elevations accumulate from starting value', () => {
    const pts = manualInputsToGpxPoints([makeInput(1, 20), makeInput(1, -10)]);
    const startElev = pts[0].elevation; // arbitrary base elevation (100 m)
    expect(pts[1].elevation).toBe(startElev + 20);
    expect(pts[2].elevation).toBe(startElev + 20 - 10);
  });
});
