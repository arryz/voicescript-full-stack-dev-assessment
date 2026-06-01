import { Badge } from '../atoms/Badge';
import type { JobStatus } from '../../types/api';

const STATUS_STYLES: Record<JobStatus, string> = {
  NEW: 'bg-gray-100 text-gray-600',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  TRANSCRIBED: 'bg-yellow-100 text-yellow-700',
  REVIEWED: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

interface Props {
  status: JobStatus;
}

export function StatusBadge({ status }: Props) {
  return <Badge className={STATUS_STYLES[status]}>{status}</Badge>;
}
