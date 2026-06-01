import { trpc } from '../../lib/trpc';
import type { JobListItem } from '../../types/api';
import { ErrorMessage } from '../atoms/ErrorMessage';
import { AssigneeListItem } from '../molecules/AssigneeListItem';

interface Props {
  job: JobListItem;
  mode: 'reporter' | 'editor';
  onClose: () => void;
  onAssignReporter: (reporterId: number) => void;
  onAssignEditor: (editorId: number) => void;
  assigning?: boolean;
}

export function AssignModal({ job, mode, onClose, onAssignReporter, onAssignEditor, assigning = false }: Props) {
  const reportersQuery = trpc.reporters.list.useQuery(
    { jobCity: job.city ?? undefined },
    { enabled: mode === 'reporter' }
  );
  const editorsQuery = trpc.editors.list.useQuery(
    undefined,
    { enabled: mode === 'editor' }
  );

  const reporters = reportersQuery.data ?? [];
  const editors = editorsQuery.data ?? [];
  const loading = mode === 'reporter' ? reportersQuery.isLoading : editorsQuery.isLoading;
  const queryError = mode === 'reporter' ? reportersQuery.error : editorsQuery.error;

  function handleSelect(id: number) {
    if (mode === 'reporter') {
      onAssignReporter(id);
    } else {
      onAssignEditor(id);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {mode === 'reporter' ? 'Assign Reporter' : 'Assign Editor'} — {job.case_name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {queryError && <ErrorMessage message={queryError.message} className="mb-3" />}

        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : mode === 'reporter' ? (
          <ul className="divide-y divide-gray-100">
            {reporters.length === 0 ? (
              <li className="text-gray-500 text-sm py-2">No available reporters</li>
            ) : (
              reporters.map((r) => (
                <AssigneeListItem
                  key={r.id}
                  name={r.name}
                  city={r.city}
                  isMatch={r.city === job.city}
                  disabled={assigning}
                  onSelect={() => handleSelect(r.id)}
                />
              ))
            )}
          </ul>
        ) : (
          <ul className="divide-y divide-gray-100">
            {editors.length === 0 ? (
              <li className="text-gray-500 text-sm py-2">No editors available</li>
            ) : (
              editors.map((e) => (
                <AssigneeListItem
                  key={e.id}
                  name={e.name}
                  disabled={assigning}
                  onSelect={() => handleSelect(e.id)}
                />
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
