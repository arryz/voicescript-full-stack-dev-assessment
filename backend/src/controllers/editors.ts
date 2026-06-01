import { NextFunction, Request, Response } from 'express';
import * as editorsService from '../services/editors';

export function handleListEditors(_req: Request, res: Response, next: NextFunction): void {
  try {
    const editors = editorsService.getEditors();
    res.status(200).json(editors);
  } catch (err) {
    next(err);
  }
}
