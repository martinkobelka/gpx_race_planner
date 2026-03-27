import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Lang } from '../i18n/translations';
import { DEFAULT_VISIBLE_COLS } from '../config/tableColumns';

export type EffortModel = 'linear' | 'power' | 'exponential' | 'minetti';
export type ColAlignment = 'left' | 'center' | 'right';

interface SettingsState {
  language: Lang;
  appMode: 'gpx' | 'manual';
  targetMode: 'pace' | 'time';
  targetPaceSeconds: number;
  targetTimeSeconds: number;
  effortModel: EffortModel;
  uphillCost: number;
  downhillBenefit: number;
  powerExponent: number;
  splitStrategy: 'negative' | 'even' | 'positive';
  splitStrength: number;
  visibleColumns: string[];
  visibleStats: string[];
  columnAlignments: Record<string, ColAlignment>;
  wideLayout: boolean;
  leftColumnPct: number;
}

const initialState: SettingsState = {
  language: 'cs',
  appMode: 'gpx',
  targetMode: 'pace',
  targetPaceSeconds: 330,
  targetTimeSeconds: 0,
  effortModel: 'minetti',
  uphillCost: 15,
  downhillBenefit: 8,
  powerExponent: 1.5,
  splitStrategy: 'even',
  splitStrength: 0.05,
  visibleColumns: DEFAULT_VISIBLE_COLS,
  visibleStats: ['distance', 'ascent', 'descent', 'time', 'pace', 'basePace', 'fastest', 'slowest'],
  columnAlignments: {},
  wideLayout: false,
  leftColumnPct: 33.33,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<Lang>) {
      state.language = action.payload;
    },
    setAppMode(state, action: PayloadAction<'gpx' | 'manual'>) {
      state.appMode = action.payload;
    },
    setTargetMode(state, action: PayloadAction<'pace' | 'time'>) {
      state.targetMode = action.payload;
    },
    setTargetPaceSeconds(state, action: PayloadAction<number>) {
      state.targetPaceSeconds = action.payload;
    },
    setTargetTimeSeconds(state, action: PayloadAction<number>) {
      state.targetTimeSeconds = action.payload;
    },
    setEffortModel(state, action: PayloadAction<EffortModel>) {
      state.effortModel = action.payload;
    },
    setUphillCost(state, action: PayloadAction<number>) {
      state.uphillCost = action.payload;
    },
    setDownhillBenefit(state, action: PayloadAction<number>) {
      state.downhillBenefit = action.payload;
    },
    setPowerExponent(state, action: PayloadAction<number>) {
      state.powerExponent = action.payload;
    },
    setSplitStrategy(state, action: PayloadAction<'negative' | 'even' | 'positive'>) {
      state.splitStrategy = action.payload;
    },
    setSplitStrength(state, action: PayloadAction<number>) {
      state.splitStrength = action.payload;
    },
    setVisibleColumns(state, action: PayloadAction<string[]>) {
      state.visibleColumns = action.payload;
    },
    setVisibleStats(state, action: PayloadAction<string[]>) {
      state.visibleStats = action.payload;
    },
    setColumnAlignment(state, action: PayloadAction<{ field: string; align: ColAlignment }>) {
      if (!state.columnAlignments) state.columnAlignments = {};
      state.columnAlignments[action.payload.field] = action.payload.align;
    },
    setWideLayout(state, action: PayloadAction<boolean>) {
      state.wideLayout = action.payload;
    },
    setLeftColumnPct(state, action: PayloadAction<number>) {
      state.leftColumnPct = action.payload;
    },
    resetSettings() {
      return initialState;
    },
  },
});

export const {
  setLanguage,
  setAppMode,
  resetSettings,
  setTargetMode,
  setTargetPaceSeconds,
  setTargetTimeSeconds,
  setEffortModel,
  setUphillCost,
  setDownhillBenefit,
  setPowerExponent,
  setSplitStrategy,
  setSplitStrength,
  setVisibleColumns,
  setVisibleStats,
  setColumnAlignment,
  setWideLayout,
  setLeftColumnPct,
} = settingsSlice.actions;
export default settingsSlice.reducer;
