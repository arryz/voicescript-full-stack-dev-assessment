import { NextFunction, Request, Response } from 'express';
import * as jobsDA from '../data-access/jobs';
import * as jobsService from '../services/jobs';

export function handleListJobs(_req: Request, res: Response, next: NextFunction): void {
  try {
    const jobs = jobsDA.listJobs();
    res.status(200).json(jobs);
  } catch (err) {
    next(err);
  }
}

export function handleCreateJob(req: Request, res: Response, next: NextFunction): void {
  try {
    const job = jobsService.createJob(req.body);
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
}

export function handleAssignReporter(req: Request, res: Response, next: NextFunction): void {
  try {
    const jobId = parseInt(req.params['id'] ?? '', 10);
    const { reporter_id } = req.body as { reporter_id: number };
    const updated = jobsService.assignReporter(jobId, reporter_id);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

export function handleMarkTranscribed(req: Request, res: Response, next: NextFunction): void {
  try {
    const jobId = parseInt(req.params['id'] ?? '', 10);
    const updated = jobsService.markTranscribed(jobId);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

export function handleAssignEditor(req: Request, res: Response, next: NextFunction): void {
  try {
    const jobId = parseInt(req.params['id'] ?? '', 10);
    const { editor_id } = req.body as { editor_id: number };
    const updated = jobsService.assignEditor(jobId, editor_id);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

export function handleCompleteJob(req: Request, res: Response, next: NextFunction): void {
  try {
    const jobId = parseInt(req.params['id'] ?? '', 10);
    const updated = jobsService.completeJob(jobId);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}
