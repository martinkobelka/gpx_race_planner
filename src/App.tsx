import React from 'react';
import ResetConfirmDialog from './components/ResetConfirmDialog';
import ResultsCalculator from './components/ResultsCalculator';
import SegmentationWatcher from './components/SegmentationWatcher';
import ManualSegmentWatcher from './components/ManualSegmentWatcher';
import AppMenubar from './components/AppMenubar';
import AppContent from './components/AppContent';
import AppFooter from './components/AppFooter';
import LayoutSettings from './components/LayoutSettings';
import { useAppSettings } from './hooks/useAppSettings';

const App: React.FC = () => {
  const { appMode } = useAppSettings();

  return (
    <div className="app-root">
      {appMode === 'gpx' ? <SegmentationWatcher /> : <ManualSegmentWatcher />}
      <ResultsCalculator />
      <ResetConfirmDialog />
      <AppMenubar />
      <AppContent />
      <AppFooter />
      <LayoutSettings />
    </div>
  );
};

export default App;
