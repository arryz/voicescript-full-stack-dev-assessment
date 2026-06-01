import { useEffect, useState } from 'react';
import type { Editor, JobListItem, Reporter } from '../../types/api';
import * as api from '../../services/api';
import { ErrorMessage } from '../atoms/ErrorMessage';
import { AssigneeListItem } from '../molecules/AssigneeListItem';

interface Props {
  job: JobListItem;
  mode: 'reporter' | 'editor';
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignModal({ job, mode, onClose, onAssigned }: Props) {
  const [reporters, setReporters] = useState<Reporter[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (mode === 'reporter') {
      api
        .fetchReporters(job.city ?? undefined)
        .then(setReporters)
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : 'Failed to load reporters')
        )
        .finally(() => setLoading(false));
    } else {
      api
        .fetchEditors()
        .then(setEditors)
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : 'Failed to load editors')
        )
        .finally(() => setLoading(false));
    }
  }, [mode, job.city]);

  async function handleSelect(id: number) {
    setAssigning(true);
    setError(null);
    try {
      if (mode === 'reporter') {
        await api.assignReporter(job.id, { reporter_id: id });
      } else {
        await api.assignEditor(job.id, { editor_id: id });
      }
      onAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assignment failed');
      setAssigning(false);
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

        {error && <ErrorMessage message={error} className="mb-3" />}

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
