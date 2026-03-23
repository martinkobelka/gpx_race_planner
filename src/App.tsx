import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Menubar } from 'primereact/menubar';
import { Card } from 'primereact/card';
import { SelectButton } from 'primereact/selectbutton';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import type { MenuItem } from 'primereact/menuitem';

import type { RootState, AppDispatch } from './store';
import { resetGpx } from './store/gpxSlice';
import { resetSegments, resetManualInputs } from './store/segmentsSlice';
import { resetResults } from './store/resultsSlice';
import { setLanguage, setAppMode, resetSettings } from './store/settingsSlice';
import type { Lang } from './i18n/translations';
import { useT } from './i18n/useT';

import GpxUploader from './components/GpxUploader';
import ManualSegmentEditor from './components/ManualSegmentEditor';
import ManualSegmentWatcher from './components/ManualSegmentWatcher';
import PaceSettings from './components/PaceSettings';
import EffortSettings from './components/EffortSettings';
import ElevationChart from './components/ElevationChart';
import SegmentsTable from './components/SegmentsTable';
import SummaryPanel from './components/SummaryPanel';
import FitExport from './components/FitExport';
import ResultsCalculator from './components/ResultsCalculator';
import SegmentationWatcher from './components/SegmentationWatcher';
import RouteMap from './components/RouteMap';
import HelpDialog from './components/HelpDialog';
import { HoveredSegmentProvider } from './contexts/HoveredSegment';

const LANGS: { value: Lang; label: string }[] = [
  { value: 'cs', label: 'CS' },
  { value: 'sk', label: 'SK' },
  { value: 'en', label: 'EN' },
];

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const t = useT();
  const smoothedPoints = useSelector((s: RootState) => s.gpx.smoothedPoints);
  const segments = useSelector((s: RootState) => s.segments.segments);
  const fileName = useSelector((s: RootState) => s.gpx.fileName);
  const language = useSelector((s: RootState) => s.settings.language);
  const appMode = useSelector((s: RootState) => s.settings.appMode);
  const [helpVisible, setHelpVisible] = React.useState(false);

  const handleFullReset = () => {
    confirmDialog({
      message: t.resetConfirmMessage,
      header: t.resetConfirmHeader,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: t.resetConfirmAccept,
      rejectLabel: t.resetConfirmReject,
      acceptClassName: 'p-button-danger',
      accept: () => {
        dispatch(resetGpx());
        dispatch(resetSegments());
        dispatch(resetManualInputs());
        dispatch(resetResults());
        dispatch(resetSettings());
      },
    });
  };

  const modeOptions = [
    { label: t.modeGpx, value: 'gpx' },
    { label: t.modeManual, value: 'manual' },
  ];

  const menuItems: MenuItem[] = [
    { label: t.resetAll, icon: 'pi pi-refresh', command: handleFullReset },
    { separator: true },
    {
      label: t.downloadFit,
      icon: 'pi pi-download',
      disabled: segments.length === 0,
      command: () => document.getElementById('fit-export-btn')?.click(),
    },
    { separator: true },
    {
      label: t.help,
      icon: 'pi pi-question-circle',
      command: () => setHelpVisible(true),
    },
  ];

  const menubarStart = (
    <div className="menubar-brand">
      <i className="pi pi-map menubar-brand__icon" />
      <span className="menubar-brand__name">{t.appName}</span>
    </div>
  );

  const menubarEnd = (
    <div className="flex align-items-center gap-2">
      <div className="lang-switcher">
        {LANGS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => dispatch(setLanguage(value))}
            className={`lang-btn${language === value ? ' lang-btn--active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="fit-export-hidden">
        <FitExport id="fit-export-btn" />
      </div>
    </div>
  );

  return (
    <div className="app-root">
      {appMode === 'gpx' ? <SegmentationWatcher /> : <ManualSegmentWatcher />}
      <ResultsCalculator />
      <ConfirmDialog />
      <HelpDialog language={language} visible={helpVisible} onHide={() => setHelpVisible(false)} />

      <Menubar
        model={menuItems}
        start={menubarStart}
        end={menubarEnd}
        className="app-menubar"
      />

      <div className="app-content">
        {segments.length > 0 && <SummaryPanel />}

        <div className="grid">
          <div className="col-12 lg:col-4">
            <div className="mb-3">
              <SelectButton
                value={appMode}
                options={modeOptions}
                onChange={(e) => e.value && dispatch(setAppMode(e.value))}
              />
            </div>

            {appMode === 'gpx' ? <GpxUploader /> : <ManualSegmentEditor />}
            <PaceSettings />
            <EffortSettings />
          </div>

          <div className="col-12 lg:col-8">
            {appMode === 'gpx' && fileName && smoothedPoints.length > 0 && segments.length > 0 && (
              <Card title={t.mapCard} className="mb-3 route-map-card">
                <RouteMap points={smoothedPoints} segments={segments} />
              </Card>
            )}

            <Card title={t.chartCard} className="mb-3">
              {smoothedPoints.length > 0 ? (
                <ElevationChart points={smoothedPoints} segments={segments} />
              ) : (
                <div className="chart-empty">
                  <i className="pi pi-map-marker chart-empty__icon" />
                  <h2 className="chart-empty__title">
                    {appMode === 'gpx' ? t.emptyTitle : t.manualEditorCard}
                  </h2>
                  <p className="chart-empty__desc">
                    {appMode === 'gpx' ? t.emptyDesc : t.manualEmptyChartHint}
                  </p>
                </div>
              )}
            </Card>

            {segments.length > 0 && (
              <Card title={t.segCardTitle(segments.length)}>
                <SegmentsTable />
              </Card>
            )}
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <a href="https://github.com/martinkobelka/gpx_race_planner" target="_blank" rel="noopener" className="app-footer__link">
          <i className="pi pi-github" /> GitHub
        </a>
        <span className="app-footer__sep">·</span>
        <a href="https://martinkobelka.cz" target="_blank" rel="noopener" className="app-footer__link">
          martinkobelka.cz
        </a>
      </footer>
    </div>
  );
};

const AppWithProvider: React.FC = () => (
  <HoveredSegmentProvider>
    <App />
  </HoveredSegmentProvider>
);

export default AppWithProvider;
