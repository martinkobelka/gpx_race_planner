import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { SelectButton } from 'primereact/selectbutton';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import CollapsibleCard from './CollapsibleCard';
import GpxUploader from './GpxUploader';
import ManualSegmentEditor from './ManualSegmentEditor';
import PaceSettings from './PaceSettings';
import EffortSettings from './EffortSettings';
import ElevationChart from './ElevationChart';
import SegmentsTable from './SegmentsTable';
import SummaryPanel from './SummaryPanel';
import RouteMap from './RouteMap';
import { useGpxData } from '../hooks/useGpxData';
import { useSegmentData } from '../hooks/useSegmentData';
import { useAppSettings } from '../hooks/useAppSettings';
import { useResults } from '../hooks/useResults';
import type { AppDispatch } from '../store';
import { setAppMode, setLeftColumnPct } from '../store/settingsSlice';
import { useT } from '../i18n/useT';
import { TILE_LAYERS, DEFAULT_TILE_LAYER_ID } from '../data/tileLayers';

const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const t = useT();
  const { smoothedPoints, fileName } = useGpxData();
  const { segments }                 = useSegmentData();
  const { appMode, wideLayout, leftColumnPct } = useAppSettings();
  const { isCalculating }            = useResults();

  const [kmMarkersEnabled, setKmMarkersEnabled] = useState(false);
  const [scaleEnabled, setScaleEnabled]         = useState(true);
  const [tileLayerId, setTileLayerId]           = useState(DEFAULT_TILE_LAYER_ID);
  const mapSettingsRef = useRef<OverlayPanel>(null);

  // Resizable columns
  const leftPct = leftColumnPct ?? 33.33;
  const [dividerActive, setDividerActive] = useState(false);
  const colsRef = useRef<HTMLDivElement>(null);
  const drag    = useRef({ active: false, startX: 0, startPct: leftPct });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!drag.current.active || !colsRef.current) return;
      const w  = colsRef.current.offsetWidth;
      const dx = e.clientX - drag.current.startX;
      dispatch(setLeftColumnPct(Math.min(Math.max(drag.current.startPct + (dx / w) * 100, 20), 75)));
    };
    const onMouseUp = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      setDividerActive(false);
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const onDividerMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    drag.current = { active: true, startX: e.clientX, startPct: leftPct };
    setDividerActive(true);
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  const modeOptions = [
    { label: t.modeGpx,    value: 'gpx'    },
    { label: t.modeManual, value: 'manual' },
  ];

  return (
    <div className={`app-content${wideLayout ? ' app-content--wide' : ''}`}>
      {segments.length > 0 && <SummaryPanel />}

      <div className="resizable-cols" ref={colsRef}>
        {/* Left column – settings */}
        <div className="resizable-cols__left" style={{ flexBasis: `${leftPct}%` }}>
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

        <div
          className={`resizable-cols__divider${dividerActive ? ' resizable-cols__divider--active' : ''}`}
          onMouseDown={onDividerMouseDown}
        />

        {/* Right column – results */}
        <div className={`resizable-cols__right results-col${isCalculating ? ' results-col--calculating' : ''}`}>
          {isCalculating && (
            <div className="results-overlay">
              <i className="pi pi-spin pi-spinner results-overlay__icon" />
            </div>
          )}

          {appMode === 'gpx' && fileName && smoothedPoints.length > 0 && segments.length > 0 && (
            <CollapsibleCard
              title={t.mapCard}
              className="mb-3 route-map-card"
              fullscreenEnabled
              headerExtra={() => (
                <Button
                  icon="pi pi-cog"
                  text rounded
                  className="collapsible-card-btn"
                  tooltip={t.mapSettingsLabel}
                  tooltipOptions={{ position: 'bottom' }}
                  onClick={(e) => mapSettingsRef.current?.toggle(e)}
                />
              )}
            >
              <RouteMap
                points={smoothedPoints}
                segments={segments}
                kmMarkersEnabled={kmMarkersEnabled}
                scaleEnabled={scaleEnabled}
                tileLayerId={tileLayerId}
              />
            </CollapsibleCard>
          )}

          <OverlayPanel ref={mapSettingsRef}>
            <div className="text-sm font-semibold mb-3">{t.mapSettingsLabel}</div>
            <div className="mb-3">
              <div className="text-sm mb-1">{t.mapTileLayerLabel}</div>
              <Dropdown
                value={tileLayerId}
                options={TILE_LAYERS.map((l) => ({ label: t[l.labelKey], value: l.id }))}
                onChange={(e) => setTileLayerId(e.value as string)}
                className="w-full"
              />
            </div>
            <div className="mb-3">
              <div className="text-sm mb-1">{t.mapKmMarkers}</div>
              <InputSwitch
                checked={kmMarkersEnabled}
                onChange={(e) => setKmMarkersEnabled(e.value ?? false)}
              />
            </div>
            <div>
              <div className="text-sm mb-1">{t.mapScale}</div>
              <InputSwitch
                checked={scaleEnabled}
                onChange={(e) => setScaleEnabled(e.value ?? false)}
              />
            </div>
          </OverlayPanel>

          <CollapsibleCard title={t.chartCard} className="mb-3" fullscreenEnabled>
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
          </CollapsibleCard>

          {segments.length > 0 && <SegmentsTable />}
        </div>
      </div>
    </div>
  );
};

export default AppContent;
