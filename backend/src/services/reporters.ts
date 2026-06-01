import * as reportersDA from '../data-access/reporters';
import { Reporter } from '../types/shared';

export function getAvailableReporters(jobCity: string | null): Reporter[] {
  return reportersDA.listAvailableReporters(jobCity);
}
