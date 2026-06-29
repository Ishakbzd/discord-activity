import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './sockets/index.js';

dotenv.config();

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: isProduction ? [CLIENT_URL] : [CLIENT_URL, 'http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin: isProduction ? CLIENT_URL : ['http://localhost:5173', CLIENT_URL],
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const frontendDist =
  process.env.FRONTEND_DIST_PATH ?? path.resolve(process.cwd(), 'public');
if (isProduction) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`WatchTogether backend running on port ${PORT}`);
});

function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  io.close();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
