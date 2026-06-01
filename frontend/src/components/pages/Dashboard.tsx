import { useDashboard } from '../../hooks/useDashboard';
import { useAssignment } from '../../hooks/useAssignment';
import { CreateJobForm } from '../organisms/CreateJobForm';
import { JobTable } from '../organisms/JobTable';
import { AssignModal } from '../organisms/AssignModal';
import { DashboardTemplate } from '../templates/DashboardTemplate';
import { ErrorMessage } from '../atoms/ErrorMessage';

export function Dashboard() {
  const { jobs, refresh, loading, error } = useDashboard();
  const { modalOpen, selectedJob, mode, openModal, openEditorModal, closeModal, onAssigned } =
    useAssignment(refresh);

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
            onRefresh={refresh}
          />
        )
      }
      modal={
        modalOpen && selectedJob ? (
          <AssignModal
            job={selectedJob}
            mode={mode}
            onClose={closeModal}
            onAssigned={onAssigned}
          />
        ) : undefined
      }
    />
  );
}
