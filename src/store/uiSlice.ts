import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  hoveredSegmentId: number | null;
  hoveredKmDist: number | null;
}

const initialState: UiState = {
  hoveredSegmentId: null,
  hoveredKmDist: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setHoveredSegmentId(state, action: PayloadAction<number | null>) {
      state.hoveredSegmentId = action.payload;
    },
    setHoveredKmDist(state, action: PayloadAction<number | null>) {
      state.hoveredKmDist = action.payload;
    },
  },
});

export const { setHoveredSegmentId, setHoveredKmDist } = uiSlice.actions;
export default uiSlice.reducer;
