import React from 'react';
import { useDispatch } from 'react-redux';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
import type { AppDispatch } from '../store';
import { setVisibleStats } from '../store/settingsSlice';
import { formatPace, formatTime } from '../services/formatters';
import { useT } from '../i18n/useT';
import { useHoveredSegment } from '../hooks/useHoveredSegment';
import { useGpxData } from '../hooks/useGpxData';
import { useAppSettings } from '../hooks/useAppSettings';
import { useResults } from '../hooks/useResults';

const ALL_STAT_KEYS = ['distance', 'ascent', 'descent', 'time', 'pace', 'basePace', 'fastest', 'slowest'] as const;
type StatKey = typeof ALL_STAT_KEYS[number];

const SummaryPanel: React.FC = () => {
  const t = useT();
  const dispatch = useDispatch<AppDispatch>();
  const { hoveredId, setHoveredId } = useHoveredSegment();
  const { totalDistance, totalElevationGain, totalElevationLoss } = useGpxData();
  const { targetPaceSeconds, visibleStats: rawVisibleStats } = useAppSettings();
  const { basePace, segmentResults } = useResults();
  const visibleStats = (rawVisibleStats ?? [...ALL_STAT_KEYS]) as StatKey[];

  const totalTimeSec = (totalDistance / 1000) * targetPaceSeconds;

  const paces = segmentResults.map(r => r.paceSec).filter(p => p > 0);
  const fastestPace = paces.length > 0 ? Math.min(...paces) : 0;
  const slowestPace = paces.length > 0 ? Math.max(...paces) : 0;
  const fastestId   = fastestPace > 0 ? (segmentResults.find(r => r.paceSec === fastestPace)?.segmentId ?? null) : null;
  const slowestId   = slowestPace > 0 ? (segmentResults.find(r => r.paceSec === slowestPace)?.segmentId ?? null) : null;

  const allStats: { key: StatKey; label: string; value: string; icon: string; color: string; highlightId?: number | null }[] = [
    { key: 'distance', label: t.statDistance,  value: totalDistance > 0 ? `${(totalDistance / 1000).toFixed(2)} km` : '—', icon: 'pi pi-map',        color: '#3b82f6' },
    { key: 'ascent',   label: t.statAscent,    value: totalElevationGain > 0 ? `+${Math.round(totalElevationGain)} m` : '—', icon: 'pi pi-arrow-up',   color: '#ef4444' },
    { key: 'descent',  label: t.statDescent,   value: totalElevationLoss > 0 ? `-${Math.round(totalElevationLoss)} m` : '—', icon: 'pi pi-arrow-down', color: '#22c55e' },
    { key: 'time',     label: t.statTime,      value: totalDistance > 0 && targetPaceSeconds > 0 ? formatTime(totalTimeSec) : '—', icon: 'pi pi-clock', color: '#8b5cf6' },
    { key: 'pace',     label: t.statPace,      value: targetPaceSeconds > 0 ? `${formatPace(targetPaceSeconds)} /km` : '—', icon: 'pi pi-bolt',       color: '#f59e0b' },
    { key: 'basePace', label: t.statBasePace,  value: basePace > 0 ? `${formatPace(basePace)} /km` : '—',                   icon: 'pi pi-chart-line', color: '#06b6d4' },
    { key: 'fastest',  label: t.statFastest,   value: fastestPace > 0 ? `${formatPace(fastestPace)} /km` : '—',             icon: 'pi pi-star',       color: '#22c55e', highlightId: fastestId },
    { key: 'slowest',  label: t.statSlowest,   value: slowestPace > 0 ? `${formatPace(slowestPace)} /km` : '—',             icon: 'pi pi-exclamation-triangle', color: '#ef4444', highlightId: slowestId },
  ];

  const statOptions = allStats.map(s => ({ label: s.label, value: s.key }));
  const visibleList = allStats.filter(s => visibleStats.includes(s.key));
  const someHidden  = visibleStats.length < ALL_STAT_KEYS.length;

  const hideCard = (key: StatKey) =>
    dispatch(setVisibleStats(visibleStats.filter(k => k !== key)));

  return (
    <div className="summary-panel mb-3">
      {someHidden && (
        <div className="summary-panel__controls">
          <MultiSelect
            value={visibleStats}
            options={statOptions}
            onChange={(e) => dispatch(setVisibleStats(e.value))}
            maxSelectedLabels={0}
            selectedItemsLabel={t.statColumns}
            placeholder={t.statColumns}
            className="col-selector"
          />
        </div>
      )}
      <div className="grid">
        {visibleList.map((s) => (
          <div
            key={s.key}
            className="col-4 lg:col summary-stat"
            onMouseEnter={() => s.highlightId != null && setHoveredId(s.highlightId)}
            onMouseLeave={() => s.highlightId != null && setHoveredId(null)}
          >
            <Card className={`summary-card${s.highlightId != null && hoveredId === s.highlightId ? ' summary-card--highlighted' : ''}`}>
              <Button
                icon="pi pi-times"
                text rounded
                className="summary-card__close"
                onClick={() => hideCard(s.key)}
              />
              <i className={`${s.icon} summary-card__icon`} style={{ '--icon-color': s.color } as React.CSSProperties} />
              <div className="summary-card__value">{s.value}</div>
              <div className="summary-card__label">{s.label}</div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryPanel;
