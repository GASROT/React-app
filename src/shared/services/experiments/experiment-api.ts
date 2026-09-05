import { apiRequest } from '../api/api-client';
import type { ExperimentEvent } from './contracts';

export async function recordExperimentEvent(event: ExperimentEvent) {
  return apiRequest<{ accepted: true }>('/experiments/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}
