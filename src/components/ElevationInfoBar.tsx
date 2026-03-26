import React from 'react';
import type { Segment } from '../types';
import { useT } from '../i18n/useT';

interface Props {
  cursorX: number | null;
  cursorDist: number | null;
  cursorElev: number | null;
  cursorGrade: number | null;
  segment: Segment | null;
}

const ElevationInfoBar: React.FC<Props> = ({ cursorX, cursorDist, cursorElev, cursorGrade, segment }) => {
  const t = useT();
  return (
    <div className="elevation-seg-data">
      {cursorX && (
        <div className="elevation-seg-data">
          <span>{t.chartDist}: {cursorDist ? (cursorDist / 1000).toFixed(2) : '-'} km</span> | <span>{t.chartElev}: {cursorElev ? cursorElev.toFixed(0) : '-'} m</span> | <span>{t.chartGrade}: {cursorGrade ? (cursorGrade * 100).toFixed(1) : '-'}%</span>
        </div>
      )}
      {cursorX && <span>|</span>}
      <div className="elevation-seg-data">
        <span>{t.chartAvgGrade}: {segment ? segment.avgSlope.toFixed(1) : '-'}%</span> | <span>{t.chartLength}: {segment?.length ? (segment.length / 1000).toFixed(2) : '-'} km</span> | <span>{t.chartGain}: {segment ? (segment.elevationGain - segment.elevationLoss).toFixed(0) : '-'} m</span>
      </div>
    </div>
  );
};

export default ElevationInfoBar;
