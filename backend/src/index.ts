import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/router';
import { createContext } from './trpc/context';

const app = express();
app.use(express.json());
app.use(cors());

app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }));

const PORT = process.env['PORT'] ?? 3001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
