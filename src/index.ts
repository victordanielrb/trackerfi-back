import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import dns from 'dns';

import { closeMongoDB } from './mongo';



// Import routers
import authRouter from './routes/auth';
import walletRouter from './routes/wallets';
import trackingRouter from './routes/tracking';
import globalDataRouter from './routes/globaldata';
import exchangeRouter from './routes/exchange';
import tokensRouter from './routes/tokens';
import usersRouter from './routes/users';

import alerts from './functions/alerts/checkAlerts';
import { initializeTokenPool } from './functions/tokenRelated/tokenPooling';

// Custom DNS
dns.setServers(['1.1.1.1', '1.0.0.1']);

const app = express();
const server = http.createServer(app);

// ── Security middleware ──
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// CORS — explicit origins, no wildcard
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:8081,http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));

// ── Rate limiting ──
const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

// Stricter limit on auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later' },
});
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

// Stricter limit on heavy CoinGecko-consuming endpoint
const tradingLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { error: 'Too many trading data requests, please try again later' },
});
app.use('/api/tokens/trading', tradingLimiter);

// ── Routes ──
app.use('/auth', authRouter);
app.use('/api/wallets', walletRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/globaldata', globalDataRouter);
app.use('/api/exchanges', exchangeRouter);
app.use('/api/tokens', tokensRouter);
app.use('/api/users', usersRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'TrackerFi Backend is running' });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
});

// ── Start server ──
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`TrackerFi Backend running on port ${PORT}`);

  // Start alerts polling (every 3 minutes) — single runner, no GH Action duplicate
  try { alerts.startAlertsPolling(); } catch (e) { console.warn('Failed to start alerts polling:', e); }

  // Initialize token pool on startup
  try { await initializeTokenPool(); } catch (e) { console.warn('Failed to initialize token pool:', e); }
});

// ── Graceful shutdown ──
async function shutdown() {
  console.log('Shutting down...');
  server.close();
  await closeMongoDB();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
