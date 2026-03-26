import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useElevationCursor } from '../../src/hooks/useElevationCursor';
import uiReducer from '../../src/store/uiSlice';
import settingsReducer from '../../src/store/settingsSlice';
import type { GpxPoint } from '../../src/types/index';

function createTestStore() {
  return configureStore({ reducer: { ui: uiReducer, settings: settingsReducer } });
}

const pt = (distance: number, elevation: number): GpxPoint => ({ lat: 0, lon: 0, distance, elevation });

// Route: 5 points, 0–4000 m, elevations 100/200/150/300/250
const points = [pt(0, 100), pt(1000, 200), pt(2000, 150), pt(3000, 300), pt(4000, 250)];
const totalDist = 4000;
const chartW = 400; // 1 px = 10 m

// toY identity — tests don't inspect the SVG Y coordinate
const toY = (elev: number) => elev;

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(Provider, { store: createTestStore() }, children);

// Helper: render hook and set cursorX in one step
function hookWith(cursorX: number | null) {
  const h = renderHook(
    () => useElevationCursor(points, [], toY, chartW, totalDist),
    { wrapper }
  );
  if (cursorX !== null) {
    act(() => h.result.current.setCursorX(cursorX));
  }
  return h.result;
}

// --- cursorDist ---

describe('useElevationCursor – cursorDist', () => {
  it('is null when no cursor is set', () => {
    expect(hookWith(null).current.cursorDist).toBeNull();
  });

  it('converts pixel position to distance (half chart → half route)', () => {
    // cursorX=200, chartW=400 → dist = (200/400)*4000 = 2000
    expect(hookWith(200).current.cursorDist).toBeCloseTo(2000, 5);
  });

  it('maps 0 → 0 and chartW → totalDist', () => {
    expect(hookWith(0).current.cursorDist).toBeCloseTo(0, 5);
    expect(hookWith(chartW).current.cursorDist).toBeCloseTo(totalDist, 5);
  });
});

// --- binary search (verified indirectly via cursorElev / cursorGrade) ---

describe('useElevationCursor – binary search (via cursorGrade)', () => {
  it('uses segment 0→1 when cursor is before the first GPS point', () => {
    // cursorX=0 → dist=0 → clamps to segment 0 → grade = (200-100)/1000 = 0.1
    expect(hookWith(0).current.cursorGrade).toBeCloseTo(0.1, 5);
  });

  it('uses last segment when cursor is past the final GPS point', () => {
    // cursorX=chartW → clamps to segment 3→4 → grade = (250-300)/1000 = -0.05
    expect(hookWith(chartW).current.cursorGrade).toBeCloseTo(-0.05, 5);
  });

  it('finds the correct segment in the middle of the route', () => {
    // cursorX=250 → dist=2500 → segment points[2](2000)→points[3](3000) → grade=(300-150)/1000=0.15
    expect(hookWith(250).current.cursorGrade).toBeCloseTo(0.15, 5);
  });

  it('finds segment 0 for a distance between points 0 and 1', () => {
    // cursorX=50 → dist=500 → segment points[0]→points[1] → grade=0.1
    expect(hookWith(50).current.cursorGrade).toBeCloseTo(0.1, 5);
  });
});

// --- cursorElev (linear interpolation) ---

describe('useElevationCursor – cursorElev', () => {
  it('is null when no cursor is set', () => {
    expect(hookWith(null).current.cursorElev).toBeNull();
  });

  it('returns elevation of first point when cursor is at start', () => {
    // dist=0 → fraction=0 → elevation = points[0].elevation = 100
    expect(hookWith(0).current.cursorElev).toBeCloseTo(100, 5);
  });

  it('interpolates linearly at the midpoint between two GPS points', () => {
    // dist=500 → midpoint of points[0](elev=100) and points[1](elev=200) → elev=150
    expect(hookWith(50).current.cursorElev).toBeCloseTo(150, 5);
  });

  it('returns second point elevation at the boundary', () => {
    // cursorX=100 → dist=1000 = points[1].distance → fraction=1.0 → elev=200
    expect(hookWith(100).current.cursorElev).toBeCloseTo(200, 5);
  });
});

// --- cursorGrade ---

describe('useElevationCursor – cursorGrade', () => {
  it('is null when no cursor is set', () => {
    expect(hookWith(null).current.cursorGrade).toBeNull();
  });

  it('computes positive grade for an uphill segment', () => {
    // Segment points[0]→points[1]: (200-100)/1000 = 0.1
    expect(hookWith(25).current.cursorGrade).toBeCloseTo(0.1, 5);
  });

  it('computes negative grade for a downhill segment', () => {
    // Segment points[1]→points[2]: (150-200)/1000 = -0.05
    // cursorX=150 → dist=1500 → index=1
    expect(hookWith(150).current.cursorGrade).toBeCloseTo(-0.05, 5);
  });

  it('computes zero grade when two consecutive points have the same distance', () => {
    const flatPts = [pt(0, 100), pt(0, 100), pt(1000, 200)];
    const h = renderHook(
      () => useElevationCursor(flatPts, [], toY, chartW, 1000),
      { wrapper }
    );
    act(() => h.result.current.setCursorX(0));
    expect(h.result.current.cursorGrade).toBe(0);
  });
});
