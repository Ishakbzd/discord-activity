import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { registerRoomRoutes } from './routes/rooms.js';

dotenv.config();

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
const isProduction = process.env.NODE_ENV === 'production';

const app = express();

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

registerRoomRoutes(app);

app.get('/api/proxy', async (req, res) => {
  const targetUrl = (req.query.url as string) ?? '';
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    res.status(400).send('Invalid URL');
    return;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('text/html')) {
      let html = await response.text();
      const baseTag = `<base href="${targetUrl.replace(/\/[^/]*$/, '/')}">`;
      html = html.replace('<head>', `<head>${baseTag}`);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } else {
      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader('Content-Type', contentType);
      res.send(buffer);
    }
  } catch {
    res.status(502).send('Failed to fetch URL');
  }
});

const frontendDist =
  process.env.FRONTEND_DIST_PATH ?? path.resolve(process.cwd(), 'public');
if (isProduction) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const server = app.listen(PORT, () => {
  console.log(`WatchTogether backend running on port ${PORT}`);
});

function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close(() => {
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
