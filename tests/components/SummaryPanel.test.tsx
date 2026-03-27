import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SummaryPanel from '../../src/components/SummaryPanel';
import gpxReducer, { setDisplayData } from '../../src/store/gpxSlice';
import settingsReducer, { setTargetPaceSeconds } from '../../src/store/settingsSlice';
import resultsReducer, { setResults } from '../../src/store/resultsSlice';
import segmentsReducer from '../../src/store/segmentsSlice';
import uiReducer from '../../src/store/uiSlice';

// Test store without redux-persist
function createTestStore(preloadedState?: Parameters<typeof configureStore>[0]['preloadedState']) {
  return configureStore({
    reducer: {
      gpx: gpxReducer,
      settings: settingsReducer,
      results: resultsReducer,
      segments: segmentsReducer,
      ui: uiReducer,
    },
    preloadedState,
  });
}

function renderWithStore(store = createTestStore()) {
  return render(
    <Provider store={store}>
      <SummaryPanel />
    </Provider>
  );
}

describe('SummaryPanel – empty state', () => {
  it('renders 6 cards with correct labels (Czech default)', () => {
    renderWithStore();
    expect(screen.getByText('Vzdálenost')).toBeInTheDocument();
    expect(screen.getByText('Stoupání')).toBeInTheDocument();
    expect(screen.getByText('Klesání')).toBeInTheDocument();
    expect(screen.getByText('Celkový čas')).toBeInTheDocument();
    expect(screen.getByText('Prům. tempo')).toBeInTheDocument();
    expect(screen.getByText('Tempo na rovině')).toBeInTheDocument();
  });

  it('shows — for all 8 values when targetPaceSeconds is 0', () => {
    // Set targetPaceSeconds=0 so the pace card also shows '—'
    const store = createTestStore({ settings: { targetPaceSeconds: 0 } as never });
    renderWithStore(store);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBe(8);
  });
});

describe('SummaryPanel – with data', () => {
  it('formats distance as "X.XX km"', () => {
    const store = createTestStore();
    store.dispatch(setDisplayData({
      smoothedPoints: [],
      totalDistance: 9980,
      totalElevationGain: 0,
      totalElevationLoss: 0,
    }));
    renderWithStore(store);
    expect(screen.getByText('9.98 km')).toBeInTheDocument();
  });

  it('formats ascent as "+X m"', () => {
    const store = createTestStore();
    store.dispatch(setDisplayData({
      smoothedPoints: [],
      totalDistance: 0,
      totalElevationGain: 72.4,
      totalElevationLoss: 0,
    }));
    renderWithStore(store);
    expect(screen.getByText('+72 m')).toBeInTheDocument();
  });

  it('formats descent as "-X m"', () => {
    const store = createTestStore();
    store.dispatch(setDisplayData({
      smoothedPoints: [],
      totalDistance: 0,
      totalElevationGain: 0,
      totalElevationLoss: 55,
    }));
    renderWithStore(store);
    expect(screen.getByText('-55 m')).toBeInTheDocument();
  });

  it('formats average pace as "m:ss /km"', () => {
    const store = createTestStore();
    store.dispatch(setTargetPaceSeconds(330)); // 5:30 /km
    renderWithStore(store);
    // Use getAllByText — pace value may appear in both the pace and basePace cards
    const paceValues = screen.getAllByText('5:30 /km');
    expect(paceValues.length).toBeGreaterThanOrEqual(1);
  });

  it('calculates total time from distance and pace', () => {
    const store = createTestStore();
    store.dispatch(setDisplayData({
      smoothedPoints: [],
      totalDistance: 10000, // 10 km
      totalElevationGain: 0,
      totalElevationLoss: 0,
    }));
    store.dispatch(setTargetPaceSeconds(360)); // 6:00 /km → total = 60 min = 1:00:00
    renderWithStore(store);
    expect(screen.getByText('1:00:00')).toBeInTheDocument();
  });

  it('shows flat-equivalent pace (basePace)', () => {
    const store = createTestStore();
    store.dispatch(setResults({ basePace: 305, segmentResults: [] })); // 5:05 /km
    renderWithStore(store);
    expect(screen.getByText('5:05 /km')).toBeInTheDocument();
  });

  it('shows — for total time when distance is missing', () => {
    const store = createTestStore();
    store.dispatch(setTargetPaceSeconds(330));
    // totalDistance = 0 (default) → time cannot be computed
    renderWithStore(store);
    const timeLabel = screen.getByText('Celkový čas');
    const timeCard = timeLabel.closest('.p-card-content')!;
    expect(timeCard.querySelector('.summary-card__value')!.textContent).toBe('—');
  });

  it('renders all 6 values with complete data', () => {
    const store = createTestStore();
    store.dispatch(setDisplayData({
      smoothedPoints: [],
      totalDistance: 9980,
      totalElevationGain: 72,
      totalElevationLoss: 72,
    }));
    store.dispatch(setTargetPaceSeconds(330));
    store.dispatch(setResults({ basePace: 320, segmentResults: [] }));
    renderWithStore(store);

    expect(screen.getByText('9.98 km')).toBeInTheDocument();
    expect(screen.getByText('+72 m')).toBeInTheDocument();
    expect(screen.getByText('-72 m')).toBeInTheDocument();
    // Use getAllByText for values that may appear in multiple cards
    expect(screen.getAllByText('5:30 /km').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('5:20 /km').length).toBeGreaterThanOrEqual(1);
    // Time: 9.98 km × 330 s = 3293.4 s ≈ 0:54:53
    expect(screen.getByText('0:54:53')).toBeInTheDocument();
  });
});
