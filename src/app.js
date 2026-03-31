/**
 * Express application factory.
 * Separated from server.js so the app is testable without binding a port.
 */

import express from 'express';
import registerRoute from './routes/register.js';
import lookupRoute from './routes/lookup.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(express.json());

  // Health check — used by Railway and load balancers
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/register', registerRoute);
  app.get('/lookup', lookupRoute);

  // 404 for any unmatched route
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });

  app.use(errorHandler);

  return app;
}
