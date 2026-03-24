import { describe, it, expect } from 'vitest';
import { computeEffortFactor, buildSegments, computeResults } from './segmentationService';
import type { Segment } from '../types/index';

describe('computeEffortFactor – linear model', () => {
  const pace = 300; // 5:00 /km

  it('returns 1.0 on flat terrain', () => {
    expect(computeEffortFactor(0, 'linear', 15, 8, pace, 1.5)).toBe(1.0);
  });

  it('returns > 1 uphill', () => {
    expect(computeEffortFactor(5, 'linear', 15, 8, pace, 1.5)).toBeGreaterThan(1);
  });

  it('returns < 1 downhill', () => {
    expect(computeEffortFactor(-5, 'linear', 15, 8, pace, 1.5)).toBeLessThan(1);
  });

  it('clamps downhill to minimum 0.5', () => {
    // Very steep downhill should not go below 0.5
    expect(computeEffortFactor(-50, 'linear', 15, 8, pace, 1.5)).toBeGreaterThanOrEqual(0.5);
  });

  it('uphill factor scales with slope', () => {
    const mild = computeEffortFactor(3, 'linear', 15, 8, pace, 1.5);
    const steep = computeEffortFactor(10, 'linear', 15, 8, pace, 1.5);
    expect(steep).toBeGreaterThan(mild);
  });
});

describe('computeEffortFactor – power model', () => {
  const pace = 300;

  it('returns > 1 uphill', () => {
    expect(computeEffortFactor(5, 'power', 15, 8, pace, 1.5)).toBeGreaterThan(1);
  });

  it('mild uphill is penalised less than linear', () => {
    const linear = computeEffortFactor(3, 'linear', 15, 8, pace, 1.5);
    const power  = computeEffortFactor(3, 'power',  15, 8, pace, 1.5);
    expect(power).toBeLessThan(linear);
  });
});

describe('computeEffortFactor – exponential model', () => {
  const pace = 300;

  it('returns > 1 uphill', () => {
    expect(computeEffortFactor(5, 'exponential', 15, 8, pace, 1.5)).toBeGreaterThan(1);
  });

  it('steep uphill penalised more than linear', () => {
    const linear = computeEffortFactor(10, 'linear',      15, 8, pace, 1.5);
    const exp    = computeEffortFactor(10, 'exponential', 15, 8, pace, 1.5);
    expect(exp).toBeGreaterThan(linear);
  });
});

describe('computeEffortFactor – minetti model', () => {
  it('returns 1.0 on flat (slope 0)', () => {
    // minettiC(0) / minettiC(0) = 1
    expect(computeEffortFactor(0, 'minetti', 15, 8, 300, 1.5)).toBeCloseTo(1.0, 5);
  });

  it('returns > 1 uphill', () => {
    expect(computeEffortFactor(10, 'minetti', 15, 8, 300, 1.5)).toBeGreaterThan(1);
  });

  it('clamps extreme downhill to minimum 0.5', () => {
    expect(computeEffortFactor(-50, 'minetti', 15, 8, 300, 1.5)).toBeGreaterThanOrEqual(0.5);
  });
});

describe('buildSegments', () => {
  it('returns [] for empty input', () => {
    expect(buildSegments([], 5, 50)).toEqual([]);
  });

  it('returns [] for single point', () => {
    expect(buildSegments([{ lat: 0, lon: 0, elevation: 100, distance: 0 }], 5, 50)).toEqual([]);
  });

  it('classifies flat points as flat segment', () => {
    const pts = [
      { lat: 0, lon: 0, elevation: 100, distance: 0 },
      { lat: 0, lon: 0, elevation: 100, distance: 500 },
      { lat: 0, lon: 0, elevation: 100, distance: 1000 },
    ];
    const segs = buildSegments(pts, 5, 50);
    expect(segs).toHaveLength(1);
    expect(segs[0].type).toBe('flat');
  });

  it('classifies steep uphill correctly', () => {
    const pts = [
      { lat: 0, lon: 0, elevation: 100, distance: 0 },
      { lat: 0, lon: 0, elevation: 110, distance: 1000 }, // 10 m/km > threshold 5
    ];
    const segs = buildSegments(pts, 5, 50);
    expect(segs[0].type).toBe('uphill');
  });

  it('classifies steep downhill correctly', () => {
    const pts = [
      { lat: 0, lon: 0, elevation: 110, distance: 0 },
      { lat: 0, lon: 0, elevation: 100, distance: 1000 }, // -10 m/km
    ];
    const segs = buildSegments(pts, 5, 50);
    expect(segs[0].type).toBe('downhill');
  });

  it('produces two segments for uphill + downhill', () => {
    const pts = [
      { lat: 0, lon: 0, elevation: 100, distance: 0 },
      { lat: 0, lon: 0, elevation: 110, distance: 1000 },
      { lat: 0, lon: 0, elevation: 100, distance: 2000 },
    ];
    const segs = buildSegments(pts, 5, 50);
    expect(segs).toHaveLength(2);
    expect(segs[0].type).toBe('uphill');
    expect(segs[1].type).toBe('downhill');
  });

  it('segment IDs start at 1 and are sequential', () => {
    const pts = [
      { lat: 0, lon: 0, elevation: 100, distance: 0 },
      { lat: 0, lon: 0, elevation: 110, distance: 1000 },
      { lat: 0, lon: 0, elevation: 100, distance: 2000 },
    ];
    const segs = buildSegments(pts, 5, 50);
    expect(segs[0].id).toBe(1);
    expect(segs[1].id).toBe(2);
  });

  it('merges too-short segment with neighbour', () => {
    // 3 segments: long uphill | tiny flat | long downhill → tiny flat should be merged
    const pts = [
      { lat: 0, lon: 0, elevation: 100, distance: 0 },
      { lat: 0, lon: 0, elevation: 110, distance: 1000 }, // uphill end
      { lat: 0, lon: 0, elevation: 110, distance: 1010 }, // tiny flat (10 m — below minSegmentLength 50)
      { lat: 0, lon: 0, elevation: 100, distance: 2000 }, // downhill end
    ];
    const segs = buildSegments(pts, 5, 50);
    // tiny flat (10 m) merged → should have fewer than 3 segments
    expect(segs.length).toBeLessThan(3);
  });

  it('computed segment length matches point distances', () => {
    const pts = [
      { lat: 0, lon: 0, elevation: 100, distance: 0 },
      { lat: 0, lon: 0, elevation: 110, distance: 1000 },
    ];
    const segs = buildSegments(pts, 5, 50);
    expect(segs[0].length).toBe(1000);
  });

  it('elevation gain/loss computed correctly', () => {
    const pts = [
      { lat: 0, lon: 0, elevation: 100, distance: 0 },
      { lat: 0, lon: 0, elevation: 150, distance: 1000 },
    ];
    const segs = buildSegments(pts, 5, 50);
    expect(segs[0].elevationGain).toBeCloseTo(50, 5);
    expect(segs[0].elevationLoss).toBeCloseTo(0, 5);
  });
});

describe('computeResults', () => {
  const flatSeg: Segment = {
    id: 1,
    startDistance: 0,
    endDistance: 1000,
    length: 1000,
    startElevation: 100,
    endElevation: 100,
    elevationGain: 0,
    elevationLoss: 0,
    avgSlope: 0,
    type: 'flat',
  };

  it('even split sets all splitFactors to 1.0', () => {
    const { splitFactors } = computeResults([flatSeg], 1000, 300, 15, 8, 'even', 0.1);
    expect(splitFactors[0]).toBe(1.0);
  });

  it('flat route produces basePace ≈ targetPaceSec', () => {
    const { basePace } = computeResults([flatSeg], 1000, 300, 15, 8, 'even', 0);
    expect(basePace).toBeCloseTo(300, 0);
  });

  it('negative split: early segment factor > late segment factor', () => {
    const seg1: Segment = { ...flatSeg, id: 1, startDistance: 0,    endDistance: 500,  length: 500 };
    const seg2: Segment = { ...flatSeg, id: 2, startDistance: 500,  endDistance: 1000, length: 500 };
    const { splitFactors } = computeResults([seg1, seg2], 1000, 300, 15, 8, 'negative', 0.2);
    expect(splitFactors[0]).toBeGreaterThan(splitFactors[1]);
  });

  it('positive split: early segment factor < late segment factor', () => {
    const seg1: Segment = { ...flatSeg, id: 1, startDistance: 0,    endDistance: 500,  length: 500 };
    const seg2: Segment = { ...flatSeg, id: 2, startDistance: 500,  endDistance: 1000, length: 500 };
    const { splitFactors } = computeResults([seg1, seg2], 1000, 300, 15, 8, 'positive', 0.2);
    expect(splitFactors[0]).toBeLessThan(splitFactors[1]);
  });

  it('uphill segment has effortFactor > 1', () => {
    const uphillSeg: Segment = { ...flatSeg, avgSlope: 5, type: 'uphill' };
    const { effortFactors } = computeResults([uphillSeg], 1000, 300, 15, 8, 'even', 0);
    expect(effortFactors[0]).toBeGreaterThan(1);
  });

  it('downhill segment has effortFactor < 1', () => {
    const downhillSeg: Segment = { ...flatSeg, avgSlope: 5, type: 'downhill' };
    const { effortFactors } = computeResults([downhillSeg], 1000, 300, 15, 8, 'even', 0);
    expect(effortFactors[0]).toBeLessThan(1);
  });

  it('returns empty arrays for empty segments', () => {
    const { effortFactors, splitFactors } = computeResults([], 0, 300, 15, 8, 'even', 0);
    expect(effortFactors).toHaveLength(0);
    expect(splitFactors).toHaveLength(0);
  });
});
