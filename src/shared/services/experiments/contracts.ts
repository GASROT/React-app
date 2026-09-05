export type ExperimentEventType = 'exposure' | 'conversion';

export interface AssignmentStrategy {
  assign<const TVariants extends readonly string[]>(
    experimentId: string,
    subjectId: string,
    variants: TVariants,
  ): TVariants[number];
}

export type ExperimentEvent = {
  experimentId: 'home-hero-cta-copy-v1';
  variant: 'control' | 'alternative';
  eventType: ExperimentEventType;
  subjectId: string;
};
