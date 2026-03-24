import { describe, it, expect } from 'vitest';
import { smoothElevations, computeElevationStats } from './gpxService';
import type { GpxPoint } from '../types/index';

const pt = (elevation: number, distance: number): GpxPoint => ({ lat: 0, lon: 0, elevation, distance });

// --- smoothElevations ---

describe('smoothElevations', () => {
  it('single point is unchanged', () => {
    const pts = [pt(100, 0)];
    const result = smoothElevations(pts, 3);
    expect(result[0].elevation).toBe(100);
  });

  it('windowSize 1 leaves all elevations unchanged', () => {
    const pts = [pt(100, 0), pt(200, 100), pt(300, 200)];
    const result = smoothElevations(pts, 1);
    result.forEach((r, i) => expect(r.elevation).toBe(pts[i].elevation));
  });

  it('middle point is average of neighbours for window 3', () => {
    const pts = [pt(100, 0), pt(200, 100), pt(300, 200)];
    const result = smoothElevations(pts, 3);
    expect(result[1].elevation).toBeCloseTo((100 + 200 + 300) / 3, 5);
  });

  it('edge point uses only available neighbours', () => {
    const pts = [pt(100, 0), pt(200, 100), pt(300, 200)];
    const result = smoothElevations(pts, 3);
    // First point: can only average [pt0, pt1] (window half=1, but left bound clips at 0)
    expect(result[0].elevation).toBeCloseTo((100 + 200) / 2, 5);
  });

  it('preserves lat, lon, distance fields', () => {
    const pts = [{ lat: 49.0, lon: 16.0, elevation: 100, distance: 500 }];
    const result = smoothElevations(pts, 3);
    expect(result[0].lat).toBe(49.0);
    expect(result[0].lon).toBe(16.0);
    expect(result[0].distance).toBe(500);
  });

  it('larger window produces more smoothing', () => {
    const pts = [pt(100, 0), pt(300, 100), pt(100, 200), pt(300, 300), pt(100, 400)];
    const small = smoothElevations(pts, 3);
    const large = smoothElevations(pts, 5);
    // Middle point with larger window should be closer to the overall mean
    const mean = (100 + 300 + 100 + 300 + 100) / 5;
    expect(Math.abs(large[2].elevation - mean)).toBeLessThan(Math.abs(small[2].elevation - mean));
  });
});

// --- computeElevationStats ---

describe('computeElevationStats', () => {
  it('flat route: gain=0, loss=0', () => {
    const pts = [pt(100, 0), pt(100, 500), pt(100, 1000)];
    const { totalElevationGain, totalElevationLoss } = computeElevationStats(pts);
    expect(totalElevationGain).toBe(0);
    expect(totalElevationLoss).toBe(0);
  });

  it('monotone uphill: correct gain, no loss', () => {
    const pts = [pt(100, 0), pt(120, 500), pt(150, 1000)];
    const { totalElevationGain, totalElevationLoss } = computeElevationStats(pts);
    expect(totalElevationGain).toBeCloseTo(50, 5);
    expect(totalElevationLoss).toBe(0);
  });

  it('monotone downhill: correct loss, no gain', () => {
    const pts = [pt(150, 0), pt(120, 500), pt(100, 1000)];
    const { totalElevationGain, totalElevationLoss } = computeElevationStats(pts);
    expect(totalElevationGain).toBe(0);
    expect(totalElevationLoss).toBeCloseTo(50, 5);
  });

  it('mixed up-down: both gain and loss computed correctly', () => {
    const pts = [pt(100, 0), pt(130, 500), pt(110, 1000)];
    const { totalElevationGain, totalElevationLoss } = computeElevationStats(pts);
    expect(totalElevationGain).toBeCloseTo(30, 5);
    expect(totalElevationLoss).toBeCloseTo(20, 5);
  });

  it('single point: gain=0, loss=0', () => {
    const { totalElevationGain, totalElevationLoss } = computeElevationStats([pt(100, 0)]);
    expect(totalElevationGain).toBe(0);
    expect(totalElevationLoss).toBe(0);
  });

  it('empty array: gain=0, loss=0', () => {
    const { totalElevationGain, totalElevationLoss } = computeElevationStats([]);
    expect(totalElevationGain).toBe(0);
    expect(totalElevationLoss).toBe(0);
  });
});
