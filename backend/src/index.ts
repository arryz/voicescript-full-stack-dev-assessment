import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { WorkflowError } from './services/workflow';
import { ValidationError, NotFoundError } from './services/jobs';

// Import db to trigger migrations on startup
import './db/index';

import jobsRouter from './routes/jobs';
import reportersRouter from './routes/reporters';
import editorsRouter from './routes/editors';

const app = express();
app.use(express.json());
app.use(cors());

// routes mounted here
app.use('/api/jobs', jobsRouter);
app.use('/api/reporters', reportersRouter);
app.use('/api/editors', editorsRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof WorkflowError) {
    res.status(409).json({ message: err.message });
    return;
  }
  if (err instanceof ValidationError) {
    res.status(400).json({ message: err.message });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env['PORT'] ?? 3001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
