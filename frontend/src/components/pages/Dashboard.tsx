import { useDashboard } from '../../hooks/useDashboard';
import { useAssignment } from '../../hooks/useAssignment';
import { CreateJobForm } from '../organisms/CreateJobForm';
import { JobTable } from '../organisms/JobTable';
import { AssignModal } from '../organisms/AssignModal';
import { DashboardTemplate } from '../templates/DashboardTemplate';
import { ErrorMessage } from '../atoms/ErrorMessage';

export function Dashboard() {
  const { jobs, refresh, loading, error } = useDashboard();
  const {
    modalOpen,
    selectedJob,
    mode,
    openModal,
    openEditorModal,
    closeModal,
    assignReporterMutation,
    markTranscribedMutation,
    assignEditorMutation,
    completeMutation,
  } = useAssignment(refresh);

  return (
    <DashboardTemplate
      header={<h1 className="text-2xl font-bold text-gray-900 mb-6">Court Reporting Workflow</h1>}
      form={<CreateJobForm onCreated={refresh} />}
      error={error ? <ErrorMessage message={error} className="mb-4" /> : undefined}
      content={
        loading ? (
          <p className="text-gray-500 text-sm">Loading jobs…</p>
        ) : (
          <JobTable
            jobs={jobs}
            onOpenAssign={openModal}
            onOpenEditorAssign={openEditorModal}
            onMarkTranscribed={(id) => markTranscribedMutation.mutate({ id })}
            onComplete={(id) => completeMutation.mutate({ id })}
          />
        )
      }
      modal={
        modalOpen && selectedJob ? (
          <AssignModal
            job={selectedJob}
            mode={mode}
            onClose={closeModal}
            assigning={assignReporterMutation.isPending || assignEditorMutation.isPending}
            onAssignReporter={(reporterId) =>
              assignReporterMutation.mutate({ id: selectedJob.id, reporter_id: reporterId })
            }
            onAssignEditor={(editorId) =>
              assignEditorMutation.mutate({ id: selectedJob.id, editor_id: editorId })
            }
          />
        ) : undefined
      }
    />
  );
}
