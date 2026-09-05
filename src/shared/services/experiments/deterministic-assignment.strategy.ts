import type { AssignmentStrategy } from './contracts';

function hash(value: string) {
  let result = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }

  return result >>> 0;
}

export class DeterministicAssignmentStrategy implements AssignmentStrategy {
  assign<const TVariants extends readonly string[]>(
    experimentId: string,
    subjectId: string,
    variants: TVariants,
  ): TVariants[number] {
    if (variants.length === 0) {
      throw new Error('Experiment must declare at least one variant.');
    }

    return variants[hash(`${experimentId}:${subjectId}`) % variants.length];
  }
}
