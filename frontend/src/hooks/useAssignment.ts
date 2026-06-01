import { useState } from 'react';
import { trpc } from '../lib/trpc';
import type { JobListItem } from '../types/api';

export function useAssignment(refresh: () => void) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListItem | null>(null);
  const [mode, setMode] = useState<'reporter' | 'editor'>('reporter');

  const assignReporterMutation = trpc.jobs.assignReporter.useMutation({
    onSuccess: () => {
      setModalOpen(false);
      setSelectedJob(null);
      refresh();
    },
  });

  const markTranscribedMutation = trpc.jobs.markTranscribed.useMutation({
    onSuccess: refresh,
  });

  const assignEditorMutation = trpc.jobs.assignEditor.useMutation({
    onSuccess: () => {
      setModalOpen(false);
      setSelectedJob(null);
      refresh();
    },
  });

  const completeMutation = trpc.jobs.complete.useMutation({
    onSuccess: refresh,
  });

  function openModal(job: JobListItem) {
    setSelectedJob(job);
    setMode('reporter');
    setModalOpen(true);
  }

  function openEditorModal(job: JobListItem) {
    setSelectedJob(job);
    setMode('editor');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedJob(null);
  }

  return {
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
  };
}
