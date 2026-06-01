import { NextFunction, Request, Response } from 'express';
import * as reportersService from '../services/reporters';

export function handleListReporters(req: Request, res: Response, next: NextFunction): void {
  try {
    const jobCity = (req.query['jobCity'] as string | undefined) ?? null;
    const reporters = reportersService.getAvailableReporters(jobCity);
    res.status(200).json(reporters);
  } catch (err) {
    next(err);
  }
}
