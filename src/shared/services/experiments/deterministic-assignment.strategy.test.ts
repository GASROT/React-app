import { describe, expect, it } from '@jest/globals';

import { DeterministicAssignmentStrategy } from './deterministic-assignment.strategy';

describe('DeterministicAssignmentStrategy', () => {
  const strategy = new DeterministicAssignmentStrategy();
  const variants = ['control', 'alternative'] as const;

  it('keeps the same participant in the same variant', () => {
    const first = strategy.assign('home-hero-cta-copy-v1', 'participant-42', variants);
    const second = strategy.assign('home-hero-cta-copy-v1', 'participant-42', variants);

    expect(second).toBe(first);
  });

  it('allocates participants across all configured variants', () => {
    const assignments = new Set(
      Array.from({ length: 100 }, (_, index) =>
        strategy.assign('home-hero-cta-copy-v1', `participant-${index}`, variants),
      ),
    );

    expect(assignments).toEqual(new Set(variants));
  });

  it('rejects an experiment without variants', () => {
    expect(() => strategy.assign('invalid', 'participant-1', [])).toThrow(
      'Experiment must declare at least one variant.',
    );
  });
});
