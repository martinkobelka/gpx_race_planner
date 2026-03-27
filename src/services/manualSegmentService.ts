import type { ManualSegmentInput, Segment, GpxPoint, SegmentType } from '../types';

export function manualInputsToSegments(inputs: ManualSegmentInput[]): Segment[] {
  let cumDist = 0;
  let cumElev = 0;
  return inputs.map((inp, idx) => {
    const lengthM = inp.lengthKm * 1000;
    const startDist = cumDist;
    const startElev = cumElev;
    cumDist += lengthM;
    cumElev += inp.elevationChangeM;
    const avgSlope = lengthM > 0 ? (inp.elevationChangeM / lengthM) * 100 : 0;
    const gain = inp.elevationChangeM > 0 ? inp.elevationChangeM : 0;
    const loss = inp.elevationChangeM < 0 ? Math.abs(inp.elevationChangeM) : 0;

    // Auto-determine type from actual slope if not overridden
    const type = inp.type;

    return {
      id: idx + 1,
      startDistance: startDist,
      endDistance: cumDist,
      length: lengthM,
      startElevation: startElev,
      endElevation: cumElev,
      elevationGain: gain,
      elevationLoss: loss,
      avgSlope,
      type,
      startPoint: { latitude: 0, longitude: 0, elevation: startElev },
      endPoint: { latitude: 0, longitude: 0, elevation: cumElev },
    };
  });
}

export function manualInputsToGpxPoints(inputs: ManualSegmentInput[]): GpxPoint[] {
  if (inputs.length === 0) return [];
  const points: GpxPoint[] = [];
  let cumDist = 0;
  let cumElev = 100; // arbitrary start elevation

  points.push({ lat: 0, lon: 0, elevation: cumElev, distance: 0 });

  for (const inp of inputs) {
    cumDist += inp.lengthKm * 1000;
    cumElev += inp.elevationChangeM;
    points.push({ lat: 0, lon: 0, elevation: cumElev, distance: cumDist });
  }

  return points;
}

export function autoType(elevChangeM: number, lengthKm: number, threshold: number): SegmentType {
  const slope = lengthKm > 0 ? elevChangeM / lengthKm : 0; // m/km
  if (slope > threshold) return 'uphill';
  if (slope < -threshold) return 'downhill';
  return 'flat';
}
