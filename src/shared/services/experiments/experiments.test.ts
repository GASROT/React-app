import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { recordExperimentEvent } from './experiment-api';
import {
  getExperiment,
  getExperimentSubjectId,
  getExperimentVariant,
  trackExperimentEvent,
} from './experiments';

jest.mock('./experiment-api', () => ({ recordExperimentEvent: jest.fn() }));

const mockedRecordEvent = jest.mocked(recordExperimentEvent);

describe('experiment registry', () => {
  beforeEach(() => {
    mockedRecordEvent.mockReset().mockResolvedValue({ accepted: true });
  });

  it('defines two CTA copies without changing the destination behavior', () => {
    const experiment = getExperiment('home-hero-cta-copy-v1');

    expect(experiment.variants).toEqual(['control', 'alternative']);
    expect(experiment.values.control.ctaLabel).toBe('Ver oferta');
    expect(experiment.values.alternative.ctaLabel).toBe('Conferir oferta');
  });

  it('returns a stable configured variant value', () => {
    const first = getExperimentVariant('home-hero-cta-copy-v1', 'participant-42');
    const second = getExperimentVariant('home-hero-cta-copy-v1', 'participant-42');

    expect(second).toEqual(first);
    expect(['Ver oferta', 'Conferir oferta']).toContain(first.value.ctaLabel);
  });

  it('creates pseudonymous identifiers for authenticated and guest participants', () => {
    expect(getExperimentSubjectId()).toMatch(/^session-[a-z0-9-]+$/);
    expect(getExperimentSubjectId('user-sensitive-id')).toMatch(/^user-[a-f0-9]+$/);
    expect(getExperimentSubjectId('user-sensitive-id')).not.toContain('sensitive');
  });

  it('records every conversion and deduplicates exposure in the current session', () => {
    trackExperimentEvent('home-hero-cta-copy-v1', 'control', 'conversion-subject', 'conversion');
    trackExperimentEvent('home-hero-cta-copy-v1', 'control', 'exposure-subject', 'exposure');
    trackExperimentEvent('home-hero-cta-copy-v1', 'control', 'exposure-subject', 'exposure');

    expect(mockedRecordEvent).toHaveBeenCalledTimes(2);
    expect(mockedRecordEvent).toHaveBeenCalledWith({
      experimentId: 'home-hero-cta-copy-v1',
      variant: 'control',
      subjectId: 'conversion-subject',
      eventType: 'conversion',
    });
  });

  it('allows retrying an exposure after a telemetry failure', async () => {
    mockedRecordEvent.mockRejectedValueOnce(new Error('offline'));

    trackExperimentEvent('home-hero-cta-copy-v1', 'alternative', 'retry-subject', 'exposure');
    await Promise.resolve();
    await Promise.resolve();
    trackExperimentEvent('home-hero-cta-copy-v1', 'alternative', 'retry-subject', 'exposure');

    expect(mockedRecordEvent).toHaveBeenCalledTimes(2);
  });
});
