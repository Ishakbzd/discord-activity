import type { Server, Socket } from 'socket.io';
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  type ChangePlaybackRatePayload,
  type ChangeStreamPayload,
  type JoinRoomPayload,
  type SeekPayload,
  type TransferHostPayload,
} from '../types/index.js';
import { checkRateLimit, clearRateLimit } from '../middleware/rateLimit.js';
import { RoomManager } from '../rooms/RoomManager.js';
import { isValidStreamUrl, sanitizeString } from '../services/urlValidator.js';

const roomManager = new RoomManager();

interface SocketSession {
  channelId: string;
  userId: string;
}

const sessions = new Map<string, SocketSession>();

function emitError(socket: Socket, message: string): void {
  socket.emit(SERVER_EVENTS.ERROR, { message });
}

function requireHost(
  socket: Socket,
  channelId: string
): { userId: string } | null {
  const session = sessions.get(socket.id);
  if (!session || session.channelId !== channelId) {
    emitError(socket, 'Not in room');
    return null;
  }

  if (!roomManager.isHost(channelId, session.userId)) {
    emitError(socket, 'Host permission required');
    return null;
  }

  return { userId: session.userId };
}

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    socket.on(CLIENT_EVENTS.JOIN_ROOM, (payload: JoinRoomPayload) => {
      if (!checkRateLimit(socket.id)) return;

      const channelId = sanitizeString(payload?.channelId ?? '');
      const userId = sanitizeString(payload?.userId ?? '');
      const username = sanitizeString(payload?.username ?? 'Unknown');

      if (!channelId || !userId) {
        emitError(socket, 'Invalid join payload');
        return;
      }

      const { room, isNewHost } = roomManager.join(channelId, socket.id, {
        id: userId,
        username,
        avatar: payload.avatar,
      });

      sessions.set(socket.id, { channelId, userId });
      socket.join(channelId);

      socket.emit(SERVER_EVENTS.SYNC_STATE, {
        state: room.state,
        users: roomManager.getUsersList(room),
        isHost: room.state.hostId === userId,
      });

      socket.to(channelId).emit(SERVER_EVENTS.USER_JOINED, {
        user: { id: userId, username, avatar: payload.avatar },
      });

      if (isNewHost && room.users.size > 1) {
        io.to(channelId).emit(SERVER_EVENTS.HOST_CHANGED, {
          hostId: room.state.hostId,
        });
      }
    });

    socket.on(CLIENT_EVENTS.LEAVE_ROOM, () => {
      handleDisconnect(socket, io);
    });

    socket.on(CLIENT_EVENTS.PLAY, () => {
      if (!checkRateLimit(socket.id)) return;
      const session = sessions.get(socket.id);
      if (!session) return;
      if (!requireHost(socket, session.channelId)) return;

      const state = roomManager.updateState(session.channelId, { playing: true });
      if (state) {
        io.to(session.channelId).emit(SERVER_EVENTS.ROOM_UPDATED, { state });
      }
    });

    socket.on(CLIENT_EVENTS.PAUSE, (payload?: SeekPayload) => {
      if (!checkRateLimit(socket.id)) return;
      const session = sessions.get(socket.id);
      if (!session) return;
      if (!requireHost(socket, session.channelId)) return;

      const updates: { playing: boolean; currentTime?: number } = {
        playing: false,
      };
      if (payload?.currentTime !== undefined && payload.currentTime >= 0) {
        updates.currentTime = payload.currentTime;
      }

      const state = roomManager.updateState(session.channelId, updates);
      if (state) {
        io.to(session.channelId).emit(SERVER_EVENTS.ROOM_UPDATED, { state });
      }
    });

    socket.on(CLIENT_EVENTS.SEEK, (payload: SeekPayload) => {
      if (!checkRateLimit(socket.id)) return;
      const session = sessions.get(socket.id);
      if (!session) return;
      if (!requireHost(socket, session.channelId)) return;

      if (typeof payload?.currentTime !== 'number' || payload.currentTime < 0) {
        emitError(socket, 'Invalid seek time');
        return;
      }

      const state = roomManager.updateState(session.channelId, {
        currentTime: payload.currentTime,
      });
      if (state) {
        io.to(session.channelId).emit(SERVER_EVENTS.ROOM_UPDATED, { state });
      }
    });

    socket.on(CLIENT_EVENTS.CHANGE_STREAM, (payload: ChangeStreamPayload) => {
      if (!checkRateLimit(socket.id)) return;
      const session = sessions.get(socket.id);
      if (!session) return;
      if (!requireHost(socket, session.channelId)) return;

      const streamUrl = sanitizeString(payload?.streamUrl ?? '', 2048);
      if (!streamUrl || !isValidStreamUrl(streamUrl)) {
        emitError(socket, 'Invalid stream URL');
        return;
      }

      const state = roomManager.updateState(session.channelId, {
        streamUrl,
        playing: false,
        currentTime: 0,
      });
      if (state) {
        io.to(session.channelId).emit(SERVER_EVENTS.ROOM_UPDATED, { state });
      }
    });

    socket.on(
      CLIENT_EVENTS.CHANGE_PLAYBACK_RATE,
      (payload: ChangePlaybackRatePayload) => {
        if (!checkRateLimit(socket.id)) return;
        const session = sessions.get(socket.id);
        if (!session) return;
        if (!requireHost(socket, session.channelId)) return;

        const rate = payload?.playbackRate;
        if (typeof rate !== 'number' || rate < 0.25 || rate > 4) {
          emitError(socket, 'Invalid playback rate');
          return;
        }

        const state = roomManager.updateState(session.channelId, {
          playbackRate: rate,
        });
        if (state) {
          io.to(session.channelId).emit(SERVER_EVENTS.ROOM_UPDATED, { state });
        }
      }
    );

    socket.on(CLIENT_EVENTS.TRANSFER_HOST, (payload: TransferHostPayload) => {
      if (!checkRateLimit(socket.id)) return;
      const session = sessions.get(socket.id);
      if (!session) return;
      if (!requireHost(socket, session.channelId)) return;

      const newHostId = sanitizeString(payload?.newHostId ?? '');
      if (!newHostId) {
        emitError(socket, 'Invalid host target');
        return;
      }

      if (roomManager.transferHost(session.channelId, newHostId)) {
        io.to(session.channelId).emit(SERVER_EVENTS.HOST_CHANGED, {
          hostId: newHostId,
        });
      } else {
        emitError(socket, 'Target user not in room');
      }
    });

    socket.on(CLIENT_EVENTS.PING, () => {
      socket.emit(SERVER_EVENTS.PONG, { timestamp: Date.now() });
    });

    socket.on('disconnect', () => {
      handleDisconnect(socket, io);
    });
  });
}

function handleDisconnect(socket: Socket, io: Server): void {
  clearRateLimit(socket.id);
  const session = sessions.get(socket.id);
  if (!session) return;

  const { room, userId, newHostId, roomDeleted } = roomManager.leave(
    session.channelId,
    socket.id
  );

  sessions.delete(socket.id);
  socket.leave(session.channelId);

  if (userId && !roomDeleted) {
    io.to(session.channelId).emit(SERVER_EVENTS.USER_LEFT, { userId });

    if (newHostId) {
      io.to(session.channelId).emit(SERVER_EVENTS.HOST_CHANGED, {
        hostId: newHostId,
      });
    }
  }

  if (room) {
    const state = roomManager.updateState(session.channelId, {});
    if (state) {
      io.to(session.channelId).emit(SERVER_EVENTS.ROOM_UPDATED, { state });
    }
  }
}
