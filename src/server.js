/**
 * Entry point. Loads environment variables and starts the HTTP server.
 */

import 'dotenv/config';
import { createApp } from './app.js';

const PORT = process.env.PORT || 3000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`agent-identity-api listening on port ${PORT}`);
});
