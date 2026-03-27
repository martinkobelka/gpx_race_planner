import { describe, it, expect } from 'vitest';
import { segmentToRow } from '../../src/services/segmentRowService';
import type { Segment, SegmentResult } from '../../src/types';

const typeLabels = { uphill: 'Stoupání', downhill: 'Klesání', flat: 'Rovina' };

function makeSeg(overrides: Partial<Segment> = {}): Segment {
  return {
    id: 1,
    startDistance: 0,
    endDistance: 5000,
    length: 5000,
    startElevation: 100,
    endElevation: 200,
    elevationGain: 100,
    elevationLoss: 0,
    avgSlope: 2.0,
    type: 'uphill',
    ...overrides,
  };
}

function makeResult(overrides: Partial<SegmentResult> = {}): SegmentResult {
  return {
    segmentId: 1,
    effortFactor: 1.1,
    splitFactor: 1.0,
    paceSec: 360,
    segmentTimeSec: 1800,
    cumulativeTimeSec: 1800,
    ...overrides,
  };
}

// --- id, fromTo, lengthKm ---

describe('segmentToRow – identity fields', () => {
  it('copies segment id', () => {
    expect(segmentToRow(makeSeg({ id: 7 }), 0, [], 300, typeLabels).id).toBe(7);
  });

  it('formats fromTo as "X.XX–Y.YY km"', () => {
    const seg = makeSeg({ startDistance: 1500, endDistance: 3750 });
    expect(segmentToRow(seg, 0, [], 300, typeLabels).fromTo).toBe('1.50–3.75 km');
  });

  it('formats lengthKm as "X.XX km"', () => {
    expect(segmentToRow(makeSeg({ length: 2340 }), 0, [], 300, typeLabels).lengthKm).toBe('2.34 km');
  });
});

// --- elevation ---

describe('segmentToRow – elevation', () => {
  it('rounds elevGain to integer', () => {
    expect(segmentToRow(makeSeg({ elevationGain: 72.6 }), 0, [], 300, typeLabels).elevGain).toBe(73);
  });

  it('rounds elevLoss to integer', () => {
    expect(segmentToRow(makeSeg({ elevationLoss: 55.4 }), 0, [], 300, typeLabels).elevLoss).toBe(55);
  });
});

// --- avgSlope ---

describe('segmentToRow – avgSlope', () => {
  it('formats slope with one decimal', () => {
    expect(segmentToRow(makeSeg({ avgSlope: 3.567 }), 0, [], 300, typeLabels).avgSlope).toBe('3.6');
  });

  it('formats negative slope correctly', () => {
    expect(segmentToRow(makeSeg({ avgSlope: -4.1 }), 0, [], 300, typeLabels).avgSlope).toBe('-4.1');
  });
});

// --- type / typeLabel ---

describe('segmentToRow – type and typeLabel', () => {
  it('copies segment type', () => {
    expect(segmentToRow(makeSeg({ type: 'downhill' }), 0, [], 300, typeLabels).type).toBe('downhill');
  });

  it('maps type to label via typeLabels', () => {
    expect(segmentToRow(makeSeg({ type: 'flat' }), 0, [], 300, typeLabels).typeLabel).toBe('Rovina');
  });
});

// --- pace (fallback vs result) ---

describe('segmentToRow – pace', () => {
  it('uses targetPaceSeconds when no result', () => {
    // 300 s/km = 5:00 /km
    const row = segmentToRow(makeSeg(), 0, [], 300, typeLabels);
    expect(row.pace).toBe('5:00/km');
  });

  it('uses result.paceSec when result is available', () => {
    // 360 s/km = 6:00 /km
    const row = segmentToRow(makeSeg(), 0, [makeResult({ paceSec: 360 })], 300, typeLabels);
    expect(row.pace).toBe('6:00/km');
  });
});

// --- segTime ---

describe('segmentToRow – segTime', () => {
  it('calculates segTime from length and targetPace when no result', () => {
    // 5000 m / 1000 * 300 s = 1500 s = 25:00
    const row = segmentToRow(makeSeg({ length: 5000 }), 0, [], 300, typeLabels);
    expect(row.segTime).toBe('25:00');
  });

  it('uses result.segmentTimeSec when result available', () => {
    // 1800 s = 30:00
    const row = segmentToRow(makeSeg(), 0, [makeResult({ segmentTimeSec: 1800 })], 300, typeLabels);
    expect(row.segTime).toBe('30:00');
  });
});

// --- cumTime ---

describe('segmentToRow – cumTime', () => {
  it('is "0:00:00" when no result', () => {
    const row = segmentToRow(makeSeg(), 0, [], 300, typeLabels);
    expect(row.cumTime).toBe('0:00:00');
  });

  it('formats result.cumulativeTimeSec correctly', () => {
    // 3661 s = 1:01:01
    const row = segmentToRow(makeSeg(), 0, [makeResult({ cumulativeTimeSec: 3661 })], 300, typeLabels);
    expect(row.cumTime).toBe('1:01:01');
  });
});

// --- avgPace ---

describe('segmentToRow – avgPace', () => {
  it('is "—" when no result (cumTime = 0)', () => {
    const row = segmentToRow(makeSeg(), 0, [], 300, typeLabels);
    expect(row.avgPace).toBe('—');
  });

  it('computes avgPace as cumulativeTimeSec / endDistanceKm', () => {
    // cumTime=1800s, endDist=5000m → avgPace = 1800/5 = 360 s/km = 6:00 /km
    const seg = makeSeg({ endDistance: 5000 });
    const row = segmentToRow(seg, 0, [makeResult({ cumulativeTimeSec: 1800 })], 300, typeLabels);
    expect(row.avgPace).toBe('6:00/km');
  });

  it('is "—" when endDistance is 0 even if cumTime > 0', () => {
    const seg = makeSeg({ endDistance: 0 });
    const row = segmentToRow(seg, 0, [makeResult({ cumulativeTimeSec: 1800 })], 300, typeLabels);
    expect(row.avgPace).toBe('—');
  });
});

// --- result index ---

describe('segmentToRow – result indexing', () => {
  it('picks result by idx, not by segmentId', () => {
    const results = [
      makeResult({ paceSec: 240 }),
      makeResult({ paceSec: 480 }),
    ];
    // idx=1 → should use second result (paceSec=480 → 8:00 /km)
    const row = segmentToRow(makeSeg(), 1, results, 300, typeLabels);
    expect(row.pace).toBe('8:00/km');
  });

  it('falls back to targetPace when idx is out of bounds', () => {
    const results = [makeResult({ paceSec: 240 })];
    // idx=5 → no result → targetPace 300 s/km = 5:00 /km
    const row = segmentToRow(makeSeg(), 5, results, 300, typeLabels);
    expect(row.pace).toBe('5:00/km');
  });
});
