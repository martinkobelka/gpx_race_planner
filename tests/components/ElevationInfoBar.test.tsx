import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import ElevationInfoBar from '../../src/components/ElevationInfoBar';
import settingsReducer from '../../src/store/settingsSlice';
import type { Segment } from '../../src/types';

function w(ui: React.ReactElement) {
  const store = configureStore({ reducer: { settings: settingsReducer } });
  return render(<Provider store={store}>{ui}</Provider>);
}

const seg: Segment = {
  id: 1,
  startDistance: 0,
  endDistance: 3500,
  length: 3500,
  startElevation: 100,
  endElevation: 200,
  elevationGain: 120,
  elevationLoss: 20,
  avgSlope: 2.5,
  type: 'uphill',
};

// --- null / no cursor ---

describe('ElevationInfoBar – no cursor', () => {
  it('shows segment avg grade when cursor is null', () => {
    w(<ElevationInfoBar cursorX={null} cursorDist={null} cursorElev={null} cursorGrade={null} segment={seg} />);
    expect(screen.getByText(/2\.5%/)).toBeInTheDocument();
  });

  it('does not show distance/elevation labels when cursorX is null', () => {
    w(<ElevationInfoBar cursorX={null} cursorDist={null} cursorElev={null} cursorGrade={null} segment={seg} />);
    expect(screen.queryByText(/Vzdál\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Výška/)).not.toBeInTheDocument();
  });

  it('shows dashes for segment data when segment is null', () => {
    w(<ElevationInfoBar cursorX={null} cursorDist={null} cursorElev={null} cursorGrade={null} segment={null} />);
    const dashes = screen.getAllByText(/-/);
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });
});

// --- with cursor ---

describe('ElevationInfoBar – with cursor', () => {
  it('shows cursor distance formatted as km', () => {
    w(<ElevationInfoBar cursorX={100} cursorDist={2500} cursorElev={150} cursorGrade={0.05} segment={seg} />);
    expect(screen.getByText(/2\.50 km/)).toBeInTheDocument();
  });

  it('shows cursor elevation in metres', () => {
    w(<ElevationInfoBar cursorX={100} cursorDist={2500} cursorElev={173} cursorGrade={0.05} segment={seg} />);
    expect(screen.getByText(/173 m/)).toBeInTheDocument();
  });

  it('shows cursor grade as percentage', () => {
    w(<ElevationInfoBar cursorX={100} cursorDist={2500} cursorElev={150} cursorGrade={0.075} segment={seg} />);
    expect(screen.getByText(/7\.5%/)).toBeInTheDocument();
  });
});

// --- segment data ---

describe('ElevationInfoBar – segment data', () => {
  it('shows segment length in km', () => {
    w(<ElevationInfoBar cursorX={null} cursorDist={null} cursorElev={null} cursorGrade={null} segment={seg} />);
    // 3500 m → 3.50 km
    expect(screen.getByText(/3\.50 km/)).toBeInTheDocument();
  });

  it('shows net elevation gain (gain - loss)', () => {
    w(<ElevationInfoBar cursorX={null} cursorDist={null} cursorElev={null} cursorGrade={null} segment={seg} />);
    // elevationGain(120) - elevationLoss(20) = 100
    expect(screen.getByText(/100 m/)).toBeInTheDocument();
  });

  it('shows average slope for segment', () => {
    w(<ElevationInfoBar cursorX={null} cursorDist={null} cursorElev={null} cursorGrade={null} segment={seg} />);
    expect(screen.getByText(/2\.5%/)).toBeInTheDocument();
  });
});
