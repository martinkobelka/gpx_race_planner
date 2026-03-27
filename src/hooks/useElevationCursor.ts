import { useState, useMemo } from 'react';
import type { MouseEvent } from 'react';
import type { GpxPoint, Segment } from '../types';
import { useHoveredSegment } from '../hooks/useHoveredSegment';

export function useElevationCursor(
  points: GpxPoint[],
  segments: Segment[],
  toY: (elev: number) => number,
  chartW: number,
  totalDist: number,
) {
  const { hoveredId, setHoveredId } = useHoveredSegment();
  const [cursorX, setCursorX] = useState<number | null>(null);

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = e.clientX - rect.left;
    const clampedX = Math.max(0, Math.min(chartW, svgX));
    setCursorX(clampedX);

    const dist = (clampedX / chartW) * totalDist;
    const nextHoveredId =
      segments.find((seg) => dist >= seg.startDistance && dist <= seg.endDistance)?.id ?? null;
    if (nextHoveredId !== hoveredId) setHoveredId(nextHoveredId);
  };

  const cursorDist = useMemo(() => {
    if (cursorX === null) return null;
    return (cursorX / chartW) * totalDist;
  }, [cursorX, chartW, totalDist]);

  const cursorPointIndex = useMemo(() => {
    if (cursorDist === null || points.length < 2) return null;
    if (cursorDist <= points[0].distance) return 0;
    if (cursorDist >= points[points.length - 1].distance) return points.length - 2;
    let lo = 0, hi = points.length - 2;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (points[mid + 1].distance < cursorDist) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }, [cursorDist, points]);

  const cursorElev = useMemo(() => {
    if (cursorDist === null || cursorPointIndex === null) return null;
    const p1 = points[cursorPointIndex], p2 = points[cursorPointIndex + 1];
    const span = p2.distance - p1.distance;
    if (span <= 0) return p1.elevation;
    const frac = (cursorDist - p1.distance) / span;
    return p1.elevation + (p2.elevation - p1.elevation) * frac;
  }, [cursorDist, cursorPointIndex, points]);

  const cursorMarkerY = useMemo(() => {
    if (cursorElev === null) return null;
    return toY(cursorElev);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursorElev]);

  const cursorGrade = useMemo(() => {
    if (cursorPointIndex === null) return null;
    const p1 = points[cursorPointIndex], p2 = points[cursorPointIndex + 1];
    const span = p2.distance - p1.distance;
    if (span <= 0) return 0;
    return (p2.elevation - p1.elevation) / span;
  }, [cursorPointIndex, points]);

  const segment = useMemo(() => {
    if (hoveredId === null) return null;
    return segments.find((s) => s.id === hoveredId) || null;
  }, [hoveredId, segments]);

  return {
    hoveredId,
    setHoveredId,
    cursorX,
    setCursorX,
    cursorDist,
    cursorElev,
    cursorMarkerY,
    cursorGrade,
    segment,
    handleMouseMove,
  };
}
