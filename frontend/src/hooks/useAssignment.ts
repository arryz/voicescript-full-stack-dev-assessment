import { useState } from 'react';
import { JobListItem } from '../types/api';

export function useAssignment(refresh: () => void) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListItem | null>(null);
  const [mode, setMode] = useState<'reporter' | 'editor'>('reporter');

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

  function onAssigned() {
    closeModal();
    refresh();
  }

  return { modalOpen, selectedJob, mode, openModal, openEditorModal, closeModal, onAssigned };
}
