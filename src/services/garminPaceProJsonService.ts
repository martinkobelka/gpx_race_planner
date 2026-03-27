
import type { PaceProSegment } from '../types';

export function generateGarminPaceProJson(
  workoutName: string,
  steps: PaceProSegment[],
  totalTimeSec: number,
  totalDistanceM: number,
): object {

  return {
    paceBandSplits: steps,
    paceBandSummary: {
        courseId: 0,
        goalTime: totalTimeSec,
        goalSpeed: totalDistanceM / totalTimeSec,
        name: workoutName,
        splitType: "ELEVATION",
        totalDistance: totalDistanceM,
        uphillEffort: 0,
        pacingStrategy: 0,
        manualPaceEdit: true,
        distanceUnit: null,
        elevationSegmentationTolerance: 50,
        paceFactor: 2,
        elevationSegmentMinLength: 1
    }
  };
}
