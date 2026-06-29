import type { Request, Response, Router } from 'express';
import { checkRateLimit } from '../middleware/rateLimit.js';
import { RoomManager } from '../rooms/RoomManager.js';
import { getApinator, getChannelName } from '../services/apinatorService.js';
import { isValidStreamUrl, sanitizeString } from '../services/urlValidator.js';

const roomManager = new RoomManager();

function requireHost(channelId: string, userId: string, res: Response): boolean {
  if (!roomManager.isHost(channelId, userId)) {
    res.status(403).json({ error: 'Host permission required' });
    return false;
  }
  return true;
}

function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
}

export function registerRoomRoutes(router: Router): void {
  router.post('/api/rooms/join', (req: Request, res: Response) => {
    try {
      if (!checkRateLimit(getClientIp(req))) {
        res.status(429).json({ error: 'Rate limit exceeded' });
        return;
      }

      const { channelId, userId, username, avatar } = req.body ?? {};
      const cleanChannelId = sanitizeString(channelId ?? '');
      const cleanUserId = sanitizeString(userId ?? '');
      const cleanUsername = sanitizeString(username ?? 'Unknown');

      if (!cleanChannelId || !cleanUserId) {
        res.status(400).json({ error: 'Invalid join payload' });
        return;
      }

      const { room, isNewHost } = roomManager.join(cleanChannelId, {
        id: cleanUserId,
        username: cleanUsername,
        avatar,
      });

      const state = room.state;
      const users = roomManager.getUsersList(room);

      if (isNewHost && users.length > 1) {
        getApinator()
          .trigger({
            name: 'host-changed',
            data: JSON.stringify({ hostId: state.hostId }),
            channel: getChannelName(cleanChannelId),
          })
          .catch(() => {});
      }

      res.json({
        state,
        users,
        isHost: state.hostId === cleanUserId,
      });
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/api/rooms/leave', (req: Request, res: Response) => {
    try {
      const { channelId, userId } = req.body ?? {};
      const cleanChannelId = sanitizeString(channelId ?? '');
      const cleanUserId = sanitizeString(userId ?? '');

      if (!cleanChannelId || !cleanUserId) {
        res.status(400).json({ error: 'Invalid leave payload' });
        return;
      }

      const { userId: leftUserId, newHostId, roomDeleted } = roomManager.leave(
        cleanChannelId,
        cleanUserId
      );

      if (!roomDeleted && leftUserId) {
        const apinator = getApinator();
        const channel = getChannelName(cleanChannelId);

        apinator.trigger({ name: 'user-left', data: JSON.stringify({ userId: leftUserId }), channel }).catch(() => {});

        if (newHostId) {
          apinator.trigger({ name: 'host-changed', data: JSON.stringify({ hostId: newHostId }), channel }).catch(() => {});
        }
      }

      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/api/rooms/play', (req: Request, res: Response) => {
    try {
      if (!checkRateLimit(getClientIp(req))) {
        res.status(429).json({ error: 'Rate limit exceeded' });
        return;
      }

      const { channelId, userId } = req.body ?? {};
      const cleanChannelId = sanitizeString(channelId ?? '');
      const cleanUserId = sanitizeString(userId ?? '');

      if (!cleanChannelId || !cleanUserId) {
        res.status(400).json({ error: 'Invalid payload' });
        return;
      }

      if (!requireHost(cleanChannelId, cleanUserId, res)) return;

      const state = roomManager.updateState(cleanChannelId, { playing: true });
      if (state) {
        getApinator()
          .trigger({
            name: 'room-updated',
            data: JSON.stringify({ state }),
            channel: getChannelName(cleanChannelId),
          })
          .catch(() => {});
        res.json({ state });
      } else {
        res.status(404).json({ error: 'Room not found' });
      }
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/api/rooms/pause', (req: Request, res: Response) => {
    try {
      if (!checkRateLimit(getClientIp(req))) {
        res.status(429).json({ error: 'Rate limit exceeded' });
        return;
      }

      const { channelId, userId, currentTime } = req.body ?? {};
      const cleanChannelId = sanitizeString(channelId ?? '');
      const cleanUserId = sanitizeString(userId ?? '');

      if (!cleanChannelId || !cleanUserId) {
        res.status(400).json({ error: 'Invalid payload' });
        return;
      }

      if (!requireHost(cleanChannelId, cleanUserId, res)) return;

      const updates: { playing: boolean; currentTime?: number } = { playing: false };
      if (typeof currentTime === 'number' && currentTime >= 0) {
        updates.currentTime = currentTime;
      }

      const state = roomManager.updateState(cleanChannelId, updates);
      if (state) {
        getApinator()
          .trigger({
            name: 'room-updated',
            data: JSON.stringify({ state }),
            channel: getChannelName(cleanChannelId),
          })
          .catch(() => {});
        res.json({ state });
      } else {
        res.status(404).json({ error: 'Room not found' });
      }
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/api/rooms/seek', (req: Request, res: Response) => {
    try {
      if (!checkRateLimit(getClientIp(req))) {
        res.status(429).json({ error: 'Rate limit exceeded' });
        return;
      }

      const { channelId, userId, currentTime } = req.body ?? {};
      const cleanChannelId = sanitizeString(channelId ?? '');
      const cleanUserId = sanitizeString(userId ?? '');

      if (!cleanChannelId || !cleanUserId) {
        res.status(400).json({ error: 'Invalid payload' });
        return;
      }

      if (typeof currentTime !== 'number' || currentTime < 0) {
        res.status(400).json({ error: 'Invalid seek time' });
        return;
      }

      if (!requireHost(cleanChannelId, cleanUserId, res)) return;

      const state = roomManager.updateState(cleanChannelId, { currentTime });
      if (state) {
        getApinator()
          .trigger({
            name: 'room-updated',
            data: JSON.stringify({ state }),
            channel: getChannelName(cleanChannelId),
          })
          .catch(() => {});
        res.json({ state });
      } else {
        res.status(404).json({ error: 'Room not found' });
      }
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/api/rooms/change-stream', (req: Request, res: Response) => {
    try {
      if (!checkRateLimit(getClientIp(req))) {
        res.status(429).json({ error: 'Rate limit exceeded' });
        return;
      }

      const { channelId, userId, streamUrl } = req.body ?? {};
      const cleanChannelId = sanitizeString(channelId ?? '');
      const cleanUserId = sanitizeString(userId ?? '');
      const cleanUrl = sanitizeString(streamUrl ?? '', 2048);

      if (!cleanChannelId || !cleanUserId) {
        res.status(400).json({ error: 'Invalid payload' });
        return;
      }

      if (!requireHost(cleanChannelId, cleanUserId, res)) return;

      if (!cleanUrl || !isValidStreamUrl(cleanUrl)) {
        res.status(400).json({ error: 'Invalid stream URL' });
        return;
      }

      const state = roomManager.updateState(cleanChannelId, {
        streamUrl: cleanUrl,
        playing: false,
        currentTime: 0,
      });
      if (state) {
        getApinator()
          .trigger({
            name: 'room-updated',
            data: JSON.stringify({ state }),
            channel: getChannelName(cleanChannelId),
          })
          .catch(() => {});
        res.json({ state });
      } else {
        res.status(404).json({ error: 'Room not found' });
      }
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/api/rooms/change-playback-rate', (req: Request, res: Response) => {
    try {
      if (!checkRateLimit(getClientIp(req))) {
        res.status(429).json({ error: 'Rate limit exceeded' });
        return;
      }

      const { channelId, userId, playbackRate } = req.body ?? {};
      const cleanChannelId = sanitizeString(channelId ?? '');
      const cleanUserId = sanitizeString(userId ?? '');

      if (!cleanChannelId || !cleanUserId) {
        res.status(400).json({ error: 'Invalid payload' });
        return;
      }

      if (typeof playbackRate !== 'number' || playbackRate < 0.25 || playbackRate > 4) {
        res.status(400).json({ error: 'Invalid playback rate' });
        return;
      }

      if (!requireHost(cleanChannelId, cleanUserId, res)) return;

      const state = roomManager.updateState(cleanChannelId, { playbackRate });
      if (state) {
        getApinator()
          .trigger({
            name: 'room-updated',
            data: JSON.stringify({ state }),
            channel: getChannelName(cleanChannelId),
          })
          .catch(() => {});
        res.json({ state });
      } else {
        res.status(404).json({ error: 'Room not found' });
      }
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/api/rooms/transfer-host', (req: Request, res: Response) => {
    try {
      if (!checkRateLimit(getClientIp(req))) {
        res.status(429).json({ error: 'Rate limit exceeded' });
        return;
      }

      const { channelId, userId, newHostId } = req.body ?? {};
      const cleanChannelId = sanitizeString(channelId ?? '');
      const cleanUserId = sanitizeString(userId ?? '');
      const cleanNewHostId = sanitizeString(newHostId ?? '');

      if (!cleanChannelId || !cleanUserId || !cleanNewHostId) {
        res.status(400).json({ error: 'Invalid payload' });
        return;
      }

      if (!requireHost(cleanChannelId, cleanUserId, res)) return;

      if (roomManager.transferHost(cleanChannelId, cleanNewHostId)) {
        getApinator()
          .trigger({
            name: 'host-changed',
            data: JSON.stringify({ hostId: cleanNewHostId }),
            channel: getChannelName(cleanChannelId),
          })
          .catch(() => {});
        res.json({ success: true });
      } else {
        res.status(400).json({ error: 'Target user not in room' });
      }
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
