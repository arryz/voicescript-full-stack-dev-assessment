import { Router } from 'express';
import {
  handleListJobs,
  handleCreateJob,
  handleAssignReporter,
  handleMarkTranscribed,
  handleAssignEditor,
  handleCompleteJob,
} from '../controllers/jobs';

const router = Router();

router.get('/', handleListJobs);
router.post('/', handleCreateJob);
router.post('/:id/assign-reporter', handleAssignReporter);
router.post('/:id/mark-transcribed', handleMarkTranscribed);
router.post('/:id/assign-editor', handleAssignEditor);
router.post('/:id/complete', handleCompleteJob);

export default router;
