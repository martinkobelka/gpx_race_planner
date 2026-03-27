import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { setResults } from '../store/resultsSlice';
import { computeResults } from '../services/segmentationService';
import type { SegmentResult } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useSegmentData } from '../hooks/useSegmentData';
import { useGpxData } from '../hooks/useGpxData';
import { useAppSettings } from '../hooks/useAppSettings';

const ResultsCalculator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { segments }    = useSegmentData();
  const { totalDistance } = useGpxData();
  const { targetPaceSeconds, effortModel, uphillCost, downhillBenefit, powerExponent, splitStrategy, splitStrength } =
    useAppSettings();

  const dPace     = useDebounce(targetPaceSeconds, 1000);
  const dModel    = useDebounce(effortModel,       1000);
  const dUphill   = useDebounce(uphillCost,        1000);
  const dDownhill = useDebounce(downhillBenefit,   1000);
  const dExponent = useDebounce(powerExponent,     1000);
  const dStrategy = useDebounce(splitStrategy,     1000);
  const dStrength = useDebounce(splitStrength,     1000);

  useEffect(() => {
    if (segments.length === 0 || totalDistance === 0 || dPace === 0) {
      dispatch(setResults({ basePace: 0, segmentResults: [] }));
      return;
    }

    const { basePace, effortFactors, splitFactors } = computeResults(
      segments,
      totalDistance,
      dPace,
      dUphill,
      dDownhill,
      dStrategy,
      dStrength,
      dModel,
      dExponent,
    );

    let cumulativeTime = 0;
    const segmentResults: SegmentResult[] = segments.map((seg, i) => {
      const pace = basePace * effortFactors[i] * splitFactors[i];
      const segTime = (seg.length / 1000) * pace;
      cumulativeTime += segTime;
      return {
        segmentId: seg.id,
        effortFactor: effortFactors[i],
        splitFactor: splitFactors[i],
        paceSec: pace,
        segmentTimeSec: segTime,
        cumulativeTimeSec: cumulativeTime,
        paceProSegment: {
          cumulativeDistanceFromStart: seg.endDistance,
          splitAvgSpeed: 1000 / pace,
          cumulativeTimeFromStart: Number(cumulativeTime.toFixed(3)),
          splitDistance: seg.length,
          startPoint: seg.startPoint,
          endPoint: seg.endPoint,
        }
      };
    });

    dispatch(setResults({ basePace, segmentResults }));
  }, [segments, totalDistance, dPace, dModel, dUphill, dDownhill, dExponent, dStrategy, dStrength, dispatch]);

  return null;
};

export default ResultsCalculator;
