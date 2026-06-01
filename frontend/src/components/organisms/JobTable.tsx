import type { JobListItem } from '../../types/api';
import { JobRow } from './JobRow';

interface Props {
  jobs: JobListItem[];
  onOpenAssign: (job: JobListItem) => void;
  onOpenEditorAssign: (job: JobListItem) => void;
  onRefresh: () => void;
}

const COLUMNS = [
  'Case', 'Duration', 'Location', 'Status',
  'Reporter', 'Editor', 'Reporter Pay', 'Editor Pay', 'Actions',
];

export function JobTable({ jobs, onOpenAssign, onOpenEditorAssign, onRefresh }: Props) {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">
                No jobs yet
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                onOpenAssign={onOpenAssign}
                onOpenEditorAssign={onOpenEditorAssign}
                onRefresh={onRefresh}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
