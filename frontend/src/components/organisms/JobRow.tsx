import type { JobListItem } from '../../types/api';
import { Button } from '../atoms/Button';
import { StatusBadge } from '../molecules/StatusBadge';
import { PayDisplay } from '../molecules/PayDisplay';

interface Props {
  job: JobListItem;
  onOpenAssign: (job: JobListItem) => void;
  onOpenEditorAssign: (job: JobListItem) => void;
  onMarkTranscribed: (jobId: number) => void;
  onComplete: (jobId: number) => void;
}

export function JobRow({ job, onOpenAssign, onOpenEditorAssign, onMarkTranscribed, onComplete }: Props) {
  const locationLabel =
    job.location_type === 'physical' && job.city
      ? `Physical — ${job.city}`
      : job.location_type === 'physical'
        ? 'Physical'
        : 'Remote';

  return (
    <tr className="hover:bg-gray-50 border-b border-gray-100">
      <td className="px-4 py-3 text-sm text-gray-800">{job.case_name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{job.duration_minutes} min</td>
      <td className="px-4 py-3 text-sm text-gray-600">{locationLabel}</td>
      <td className="px-4 py-3">
        <StatusBadge status={job.status} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{job.reporter_name ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{job.editor_name ?? '—'}</td>
      <td className="px-4 py-3">
        <PayDisplay value={job.reporter_pay} />
      </td>
      <td className="px-4 py-3">
        <PayDisplay value={job.editor_pay} />
      </td>
      <td className="px-4 py-3 text-sm">
        {job.status === 'NEW' && (
          <Button variant="text" color="blue" onClick={() => onOpenAssign(job)}>
            Assign Reporter
          </Button>
        )}
        {job.status === 'ASSIGNED' && (
          <Button variant="text" color="yellow" onClick={() => onMarkTranscribed(job.id)}>
            Mark Transcribed
          </Button>
        )}
        {job.status === 'TRANSCRIBED' && (
          <Button variant="text" color="purple" onClick={() => onOpenEditorAssign(job)}>
            Assign Editor
          </Button>
        )}
        {job.status === 'REVIEWED' && (
          <Button variant="text" color="green" onClick={() => onComplete(job.id)}>
            Complete
          </Button>
        )}
        {job.status === 'COMPLETED' && <span className="text-gray-400 text-xs">Done</span>}
      </td>
    </tr>
  );
}
