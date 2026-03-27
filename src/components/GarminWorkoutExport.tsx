import React from 'react';
import { Button } from 'primereact/button';
import { generateGarminJson } from '../services/garminJsonService';
import type { GarminWorkoutStep } from '../services/garminJsonService';
import { formatPace } from '../services/formatters';
import { useT } from '../i18n/useT';
import { useSegmentData } from '../hooks/useSegmentData';
import { useGpxData } from '../hooks/useGpxData';
import { useAppSettings } from '../hooks/useAppSettings';
import { useResults } from '../hooks/useResults';

const GarminWorkoutExport: React.FC<{ id?: string }> = ({ id }) => {
  const t = useT();
  const { segments }                    = useSegmentData();
  const { segmentResults }              = useResults();
  const { fileName, totalDistance }     = useGpxData();
  const { targetPaceSeconds: targetPaceSec, appMode } = useAppSettings();

  const handleExport = () => {
    if (segments.length === 0) return;

    const baseName = appMode === 'gpx' && fileName
      ? fileName.replace(/\.gpx$/i, '')
      : 'race_plan';
    const workoutName = baseName.substring(0, 30);

    const totalTimeSec = segmentResults.length > 0
      ? segmentResults[segmentResults.length - 1].cumulativeTimeSec
      : (totalDistance / 1000) * targetPaceSec;

    const steps: GarminWorkoutStep[] = segments.map((seg, idx) => {
      const result = segmentResults[idx];
      const pace   = result ? result.paceSec : targetPaceSec;
      const typeLabel = seg.type === 'uphill' ? '↑' : seg.type === 'downhill' ? '↓' : '→';
      return {
        label: `${idx + 1}. ${typeLabel} ${formatPace(pace)}/km`,
        distanceMeters: seg.length,
        targetPaceSec: pace,
      };
    });

    const json = generateGarminJson(workoutName, steps, totalTimeSec, totalDistance);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${baseName.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      id={id}
      label={t.downloadFit}
      icon="pi pi-download"
      severity="success"
      onClick={handleExport}
      disabled={segments.length === 0}
    />
  );
};

export default GarminWorkoutExport;
