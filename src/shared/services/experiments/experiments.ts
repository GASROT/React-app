import type { ExperimentEventType } from './contracts';
import { DeterministicAssignmentStrategy } from './deterministic-assignment.strategy';
import { recordExperimentEvent } from './experiment-api';

const HOME_HERO_CTA_EXPERIMENT = 'home-hero-cta-copy-v1' as const;
const sessionSubjectId = `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const assignmentStrategy = new DeterministicAssignmentStrategy();
const recordedExposures = new Set<string>();

const experiments = {
  [HOME_HERO_CTA_EXPERIMENT]: {
    variants: ['control', 'alternative'] as const,
    values: {
      control: { ctaLabel: 'Ver oferta' },
      alternative: { ctaLabel: 'Conferir oferta' },
    },
  },
} as const;

export type ExperimentId = keyof typeof experiments;

export function getExperiment<TExperimentId extends ExperimentId>(experimentId: TExperimentId) {
  return experiments[experimentId];
}

export function getExperimentSubjectId(userId?: string) {
  if (!userId) return sessionSubjectId;

  const encoded = Array.from(userId).reduce(
    (result, character) => Math.imul(result ^ character.charCodeAt(0), 16777619) >>> 0,
    2166136261,
  );
  return `user-${encoded.toString(16)}`;
}

export function getExperimentVariant(
  experimentId: typeof HOME_HERO_CTA_EXPERIMENT,
  subjectId: string,
) {
  const experiment = experiments[experimentId];
  const variant = assignmentStrategy.assign(experimentId, subjectId, experiment.variants);

  return { variant, value: experiment.values[variant] };
}

export function trackExperimentEvent(
  experimentId: typeof HOME_HERO_CTA_EXPERIMENT,
  variant: 'control' | 'alternative',
  subjectId: string,
  eventType: ExperimentEventType,
) {
  const exposureKey = `${experimentId}:${subjectId}`;
  if (eventType === 'exposure') {
    if (recordedExposures.has(exposureKey)) return;
    recordedExposures.add(exposureKey);
  }

  void recordExperimentEvent({ experimentId, variant, subjectId, eventType }).catch(() => {
    if (eventType === 'exposure') recordedExposures.delete(exposureKey);
  });
}

export { HOME_HERO_CTA_EXPERIMENT };
