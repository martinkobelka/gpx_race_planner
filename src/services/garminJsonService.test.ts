import { describe, it, expect } from 'vitest';
import { generateGarminJson } from './garminJsonService';
import type { GarminWorkoutStep } from './garminJsonService';

const step = (distanceMeters: number, targetPaceSec: number, label: string): GarminWorkoutStep => ({
  distanceMeters,
  targetPaceSec,
  label,
});

describe('generateGarminJson', () => {
  it('sets workoutName correctly', () => {
    const json = generateGarminJson('My Race', [], 0, 0) as Record<string, unknown>;
    expect(json.workoutName).toBe('My Race');
  });

  it('sets estimatedDurationInSecs', () => {
    const json = generateGarminJson('Test', [], 3600, 10000) as Record<string, unknown>;
    expect(json.estimatedDurationInSecs).toBe(3600);
  });

  it('rounds estimatedDurationInSecs', () => {
    const json = generateGarminJson('Test', [], 3600.7, 10000) as Record<string, unknown>;
    expect(json.estimatedDurationInSecs).toBe(3601);
  });

  it('sets estimatedDistanceInMeters', () => {
    const json = generateGarminJson('Test', [], 0, 9980) as Record<string, unknown>;
    expect(json.estimatedDistanceInMeters).toBe(9980);
  });

  it('has exactly one workoutSegment', () => {
    const json = generateGarminJson('Test', [], 0, 0) as Record<string, unknown>;
    const segments = json.workoutSegments as unknown[];
    expect(segments).toHaveLength(1);
  });

  it('workoutSteps count matches input steps', () => {
    const steps = [step(500, 300, 'seg 1'), step(1000, 320, 'seg 2')];
    const json = generateGarminJson('Test', steps, 0, 0) as Record<string, unknown>;
    const segments = json.workoutSegments as Array<Record<string, unknown>>;
    expect(segments[0].workoutSteps as unknown[]).toHaveLength(2);
  });

  it('empty steps produces 0 workoutSteps', () => {
    const json = generateGarminJson('Test', [], 0, 0) as Record<string, unknown>;
    const segments = json.workoutSegments as Array<Record<string, unknown>>;
    expect(segments[0].workoutSteps as unknown[]).toHaveLength(0);
  });

  it('step endConditionValue matches distanceMeters', () => {
    const steps = [step(800, 300, 'seg 1')];
    const json = generateGarminJson('Test', steps, 0, 0) as Record<string, unknown>;
    const segments = json.workoutSegments as Array<Record<string, unknown>>;
    const workoutStep = (segments[0].workoutSteps as Array<Record<string, unknown>>)[0];
    expect(workoutStep.endConditionValue).toBe(800);
  });

  it('targetValueOne (faster) > targetValueTwo (slower)', () => {
    const steps = [step(1000, 300, 'seg 1')]; // pace 5:00/km
    const json = generateGarminJson('Test', steps, 0, 0) as Record<string, unknown>;
    const segments = json.workoutSegments as Array<Record<string, unknown>>;
    const workoutStep = (segments[0].workoutSteps as Array<Record<string, unknown>>)[0];
    expect(workoutStep.targetValueOne as number).toBeGreaterThan(workoutStep.targetValueTwo as number);
  });

  it('speed bounds are ±5% around target speed', () => {
    const paceSec = 300; // 5:00 /km → speed = 1000/300 m/s
    const steps = [step(1000, paceSec, 'seg 1')];
    const json = generateGarminJson('Test', steps, 0, 0) as Record<string, unknown>;
    const segments = json.workoutSegments as Array<Record<string, unknown>>;
    const workoutStep = (segments[0].workoutSteps as Array<Record<string, unknown>>)[0];
    const expectedSpeed = 1000 / paceSec;
    expect(workoutStep.targetValueOne as number).toBeCloseTo(expectedSpeed * 1.05, 10);
    expect(workoutStep.targetValueTwo as number).toBeCloseTo(expectedSpeed * 0.95, 10);
  });

  it('avgTrainingSpeed matches totalDistance / totalTime', () => {
    const json = generateGarminJson('Test', [], 1000, 10000) as Record<string, unknown>;
    expect(json.avgTrainingSpeed as number).toBeCloseTo(10, 10); // 10000m / 1000s = 10 m/s
  });

  it('sportType is running', () => {
    const json = generateGarminJson('Test', [], 0, 0) as Record<string, unknown>;
    const sport = json.sportType as Record<string, unknown>;
    expect(sport.sportTypeKey).toBe('running');
  });
});
