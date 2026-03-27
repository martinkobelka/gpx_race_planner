import type { GpxPoint, Segment, SegmentType } from '../types';
import type { EffortModel } from '../store/settingsSlice';

// Minetti et al. (2002): energy cost of running as a function of slope fraction i
function minettiC(i: number): number {
  return 155.4 * i ** 5 - 30.4 * i ** 4 - 43.3 * i ** 3 + 46.3 * i ** 2 + 19.5 * i + 3.6;
}
const MINETTI_FLAT = minettiC(0); // 3.6 J/kg/m

export function computeEffortFactor(
  slopePct: number,       // avg slope in %, signed (positive = uphill)
  model: EffortModel,
  uphillCost: number,     // s/km per 1% (linear/power/exponential)
  downhillBenefit: number,
  targetPaceSec: number,
  powerExponent: number,
): number {
  const REF_SLOPE = 10; // normalisation reference for power model (keeps params comparable to linear)

  if (model === 'minetti') {
    const i = slopePct / 100;
    return Math.max(0.5, minettiC(i) / MINETTI_FLAT);
  }

  if (slopePct >= 0) {
    // uphill or flat
    const slope = Math.abs(slopePct);
    if (slope === 0) return 1.0;
    if (model === 'linear') {
      return 1 + (slope * uphillCost) / targetPaceSec;
    }
    if (model === 'power') {
      const normalized = slope ** powerExponent / REF_SLOPE ** (powerExponent - 1);
      return 1 + (normalized * uphillCost) / targetPaceSec;
    }
    // exponential
    return Math.exp((slope * uphillCost) / targetPaceSec);
  } else {
    // downhill
    const slope = Math.abs(slopePct);
    if (model === 'linear') {
      return Math.max(0.5, 1 - (slope * downhillBenefit) / targetPaceSec);
    }
    if (model === 'power') {
      const normalized = slope ** powerExponent / REF_SLOPE ** (powerExponent - 1);
      return Math.max(0.5, 1 - (normalized * downhillBenefit) / targetPaceSec);
    }
    // exponential
    return Math.max(0.5, Math.exp(-(slope * downhillBenefit) / targetPaceSec));
  }
}

interface RawSegment {
  startIdx: number;
  endIdx: number;
  type: SegmentType;
}

export function buildSegments(
  points: GpxPoint[],
  slopeThreshold: number,
  minSegmentLength: number
): Segment[] {
  if (points.length < 2) return [];

  // Classify each inter-point gap
  const types: SegmentType[] = [];
  for (let i = 1; i < points.length; i++) {
    const deltaElev = points[i].elevation - points[i - 1].elevation;
    const deltaDist = points[i].distance - points[i - 1].distance;
    if (deltaDist === 0) {
      types.push('flat');
      continue;
    }
    const slope = (deltaElev / deltaDist) * 1000; // m/km
    if (slope > slopeThreshold) types.push('uphill');
    else if (slope < -slopeThreshold) types.push('downhill');
    else types.push('flat');
  }

  // Merge consecutive same-type gaps into raw segments
  let rawSegments: RawSegment[] = [];
  let start = 0;
  for (let i = 1; i < types.length; i++) {
    if (types[i] !== types[i - 1]) {
      rawSegments.push({ startIdx: start, endIdx: i, type: types[i - 1] });
      start = i;
    }
  }
  rawSegments.push({ startIdx: start, endIdx: types.length, type: types[types.length - 1] });

  // Eliminate too-short segments by merging with neighbours
  let changed = true;
  while (changed && rawSegments.length > 1) {
    changed = false;
    const result: RawSegment[] = [];
    let i = 0;
    while (i < rawSegments.length) {
      const seg = rawSegments[i];
      const startPt = points[seg.startIdx];
      const endPt = points[Math.min(seg.endIdx, points.length - 1)];
      const len = endPt.distance - startPt.distance;
      if (len < minSegmentLength) {
        // Merge with previous if exists, else with next
        if (result.length > 0) {
          result[result.length - 1].endIdx = seg.endIdx;
        } else if (i + 1 < rawSegments.length) {
          rawSegments[i + 1].startIdx = seg.startIdx;
          i++;
          continue;
        } else {
          result.push(seg);
        }
        changed = true;
      } else {
        result.push(seg);
      }
      i++;
    }
    rawSegments = result;
  }

  return rawSegments.map((r, idx) => makeSegment(idx + 1, r, points));
}

function makeSegment(id: number, raw: RawSegment, points: GpxPoint[]): Segment {
  const startPt = points[raw.startIdx];
  const endPt = points[Math.min(raw.endIdx, points.length - 1)];
  const length = endPt.distance - startPt.distance;

  let elevGain = 0;
  let elevLoss = 0;
  for (let i = raw.startIdx + 1; i <= Math.min(raw.endIdx, points.length - 1); i++) {
    const delta = points[i].elevation - points[i - 1].elevation;
    if (delta > 0) elevGain += delta;
    else elevLoss += Math.abs(delta);
  }

  const elevDelta = endPt.elevation - startPt.elevation;
  const avgSlope = length > 0 ? (elevDelta / length) * 100 : 0;

  return {
    id,
    startDistance: startPt.distance,
    endDistance: endPt.distance,
    length,
    startElevation: startPt.elevation,
    endElevation: endPt.elevation,
    elevationGain: elevGain,
    elevationLoss: elevLoss,
    avgSlope,
    type: raw.type,
    startPoint: { latitude: startPt.lat, longitude: startPt.lon, elevation: startPt.elevation },
    endPoint: { latitude: endPt.lat, longitude: endPt.lon, elevation: endPt.elevation },
  };
}

export function computeResults(
  segments: Segment[],
  totalDistance: number,
  targetPaceSec: number,
  uphillCost: number,
  downhillBenefit: number,
  splitStrategy: 'negative' | 'even' | 'positive',
  splitStrength: number,
  effortModel: EffortModel = 'linear',
  powerExponent: number = 1.5,
): { basePace: number; effortFactors: number[]; splitFactors: number[] } {
  const effortFactors = segments.map((seg) => {
    // pass signed slope so Minetti can use it directly; others split by type
    const signedSlope = seg.type === 'downhill' ? -Math.abs(seg.avgSlope) : Math.abs(seg.avgSlope);
    return computeEffortFactor(signedSlope, effortModel, uphillCost, downhillBenefit, targetPaceSec, powerExponent);
  });

  const splitFactors = segments.map((seg) => {
    if (splitStrategy === 'even') return 1.0;
    const midDist = (seg.startDistance + seg.endDistance) / 2;
    const pos = totalDistance > 0 ? midDist / totalDistance : 0;
    if (splitStrategy === 'negative') {
      return 1 + splitStrength * (0.5 - pos);
    } else {
      return 1 - splitStrength * (0.5 - pos);
    }
  });

  const weightedSum = segments.reduce((acc, seg, i) => {
    return acc + (seg.length / 1000) * effortFactors[i] * splitFactors[i];
  }, 0);

  const totalTimeSec = (totalDistance / 1000) * targetPaceSec;
  const basePace = weightedSum > 0 ? totalTimeSec / weightedSum : targetPaceSec;

  return { basePace, effortFactors, splitFactors };
}
