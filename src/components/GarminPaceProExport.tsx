import React from 'react';
import { Button } from 'primereact/button';
import { useT } from '../i18n/useT';
import { useGpxData } from '../hooks/useGpxData';
import { useAppSettings } from '../hooks/useAppSettings';
import { useResults } from '../hooks/useResults';
import type { PaceProSegment } from '../types';
import { generateGarminPaceProJson } from '../services/garminPaceProJsonService';

const GarminPaceProExport: React.FC<{ id?: string }> = ({ id }) => {
  const t = useT();
  const { segmentResults }              = useResults();
  const { fileName, totalDistance }     = useGpxData();
  const { targetPaceSeconds: targetPaceSec, appMode } = useAppSettings();

  const handleExport = () => {
    console.log('Exporting Garmin PacePro JSON...');
    if (segmentResults.length === 0) return;

    const baseName = appMode === 'gpx' && fileName
      ? fileName.replace(/\.gpx$/i, '')
      : 'race_plan';
    const workoutName = baseName.substring(0, 30);

    const totalTimeSec = segmentResults.length > 0
      ? segmentResults[segmentResults.length - 1].cumulativeTimeSec
      : (totalDistance / 1000) * targetPaceSec;

    const steps: PaceProSegment[] = segmentResults.map((result) => {
      return result.paceProSegment;
    });

    const json = generateGarminPaceProJson(workoutName, steps, totalTimeSec, totalDistance);
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
      label={t.downloadPacePro}
      icon="pi pi-download"
      severity="success"
      onClick={handleExport}
      disabled={segmentResults.length === 0}
    />
  );
};

export default GarminPaceProExport;
