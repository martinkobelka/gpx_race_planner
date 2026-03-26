import type { Segment, SegmentResult, SegmentType } from '../types';
import { formatPace, formatDuration, formatTime } from './formatters';

export interface RowData {
  id: number;
  fromTo: string;
  lengthKm: string;
  elevGain: number;
  elevLoss: number;
  avgSlope: string;
  type: SegmentType;
  typeLabel: string;
  pace: string;
  segTime: string;
  cumTime: string;
  avgPace: string;
}

export function segmentToRow(
  seg: Segment,
  idx: number,
  segmentResults: SegmentResult[],
  targetPaceSeconds: number,
  typeLabels: Record<SegmentType, string>,
): RowData {
  const result: SegmentResult | undefined = segmentResults[idx];
  const pace = result ? result.paceSec : targetPaceSeconds;
  const segTime = result ? result.segmentTimeSec : (seg.length / 1000) * targetPaceSeconds;
  const cumTime = result ? result.cumulativeTimeSec : 0;
  const cumDistKm = seg.endDistance / 1000;
  const avgPaceSec = cumTime > 0 && cumDistKm > 0 ? cumTime / cumDistKm : 0;
  return {
    id: seg.id,
    fromTo: `${(seg.startDistance / 1000).toFixed(2)}–${(seg.endDistance / 1000).toFixed(2)} km`,
    lengthKm: `${(seg.length / 1000).toFixed(2)} km`,
    elevGain: Math.round(seg.elevationGain),
    elevLoss: Math.round(seg.elevationLoss),
    avgSlope: seg.avgSlope.toFixed(1),
    type: seg.type,
    typeLabel: typeLabels[seg.type],
    pace: `${formatPace(pace)}/km`,
    segTime: formatDuration(segTime),
    cumTime: formatTime(cumTime),
    avgPace: avgPaceSec > 0 ? `${formatPace(avgPaceSec)}/km` : '—',
  };
}
