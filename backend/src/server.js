import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import { notFound, errorHandler } from './middleware/errors.js';
import { connectDB } from './config/db.js';
import { bootstrapSuperAdminIfConfigured } from './services/bootstrapService.js';

const app = express();

// Hostinger (like most Node hosting) terminates TLS and proxies requests into
// the app. Trusting the first hop gives correct client IPs for things like
// express-rate-limit; it has no effect under direct local development.
app.set('trust proxy', 1);

// CORS origins come from the CLIENT_ORIGINS env var (a comma-separated list),
// so local development and production can each configure their own origins
// without code changes. If the var is unset, fall back to the standard set of
// production (apex + www) and local-development origins. No wildcard is ever used.
const DEFAULT_CLIENT_ORIGINS = [
  'https://byrgop.com',
  'https://www.byrgop.com',
  'https://byrgop.in',
  'https://www.byrgop.in',
  'http://localhost:5175',
  'http://localhost:5174',
].join(',');

const allowedOrigins = (process.env.CLIENT_ORIGINS || DEFAULT_CLIENT_ORIGINS)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Requests without an Origin header (same-origin fetches, health checks,
      // server-to-server calls, curl) are not subject to CORS: allow them
      // through without emitting cross-origin headers. No wildcard is ever used.
      if (!origin) return cb(null, false);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      const err = new Error('Origin not allowed by CORS');
      err.status = 403;
      cb(err);
    },
  })
);
app.use(express.json());

app.use('/api/v1', apiRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

connectDB()
  .then(async () => {
    await bootstrapSuperAdminIfConfigured();
  })
  .then(() => {
    const server = app.listen(PORT, HOST, () =>
      console.log(`[api] listening on http://${HOST}:${PORT}`)
    );
    server.on('error', (err) => {
      console.error(`[api] failed to listen on ${HOST}:${PORT} — ${err.message}`);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error(`[startup] failed to start API: ${err.message}`);
    process.exit(1);
  });