import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import gpxReducer from './gpxSlice';
import segmentsReducer from './segmentsSlice';
import settingsReducer from './settingsSlice';
import resultsReducer from './resultsSlice';
import uiReducer from './uiSlice';

// Inline localStorage adapter — avoids CJS/ESM resolution issues with redux-persist/lib/storage in Vite
const localStorageAdapter = {
  getItem: (key: string): Promise<string | null> =>
    Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string): Promise<void> =>
    Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key: string): Promise<void> =>
    Promise.resolve(localStorage.removeItem(key)),
};

const rootReducer = combineReducers({
  gpx: gpxReducer,
  segments: segmentsReducer,
  settings: settingsReducer,
  results: resultsReducer,
  ui: uiReducer,
});

const persistConfig = {
  key: 'gpx-race-planner',
  storage: localStorageAdapter,
  blacklist: ['gpx', 'segments', 'results', 'ui'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
