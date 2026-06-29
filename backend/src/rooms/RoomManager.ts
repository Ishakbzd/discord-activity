import type { RoomState, RoomUser } from '../types/index.js';

interface Room {
  channelId: string;
  state: RoomState;
  users: Map<string, RoomUser>;
  socketToUser: Map<string, string>;
}

function createDefaultState(hostId: string): RoomState {
  return {
    streamUrl: '',
    playing: false,
    currentTime: 0,
    playbackRate: 1,
    hostId,
    lastUpdated: Date.now(),
  };
}

export class RoomManager {
  private rooms = new Map<string, Room>();

  join(
    channelId: string,
    socketId: string,
    user: RoomUser
  ): { room: Room; isNewHost: boolean } {
    let room = this.rooms.get(channelId);

    if (!room) {
      room = {
        channelId,
        state: createDefaultState(user.id),
        users: new Map(),
        socketToUser: new Map(),
      };
      this.rooms.set(channelId, room);
    }

    room.users.set(user.id, user);
    room.socketToUser.set(socketId, user.id);

    const isNewHost = !room.state.hostId || !room.users.has(room.state.hostId);
    if (isNewHost) {
      room.state.hostId = user.id;
    }

    return { room, isNewHost };
  }

  leave(channelId: string, socketId: string): {
    room: Room | null;
    userId: string | null;
    newHostId: string | null;
    roomDeleted: boolean;
  } {
    const room = this.rooms.get(channelId);
    if (!room) {
      return { room: null, userId: null, newHostId: null, roomDeleted: false };
    }

    const userId = room.socketToUser.get(socketId) ?? null;
    if (!userId) {
      return { room, userId: null, newHostId: null, roomDeleted: false };
    }

    room.socketToUser.delete(socketId);
    room.users.delete(userId);

    let newHostId: string | null = null;
    if (room.state.hostId === userId && room.users.size > 0) {
      newHostId = room.users.keys().next().value ?? null;
      if (newHostId) {
        room.state.hostId = newHostId;
      }
    }

    let roomDeleted = false;
    if (room.users.size === 0) {
      this.rooms.delete(channelId);
      roomDeleted = true;
    }

    return { room: roomDeleted ? null : room, userId, newHostId, roomDeleted };
  }

  getRoom(channelId: string): Room | undefined {
    return this.rooms.get(channelId);
  }

  getUserId(channelId: string, socketId: string): string | null {
    return this.rooms.get(channelId)?.socketToUser.get(socketId) ?? null;
  }

  isHost(channelId: string, userId: string): boolean {
    const room = this.rooms.get(channelId);
    return room?.state.hostId === userId;
  }

  updateState(channelId: string, updates: Partial<RoomState>): RoomState | null {
    const room = this.rooms.get(channelId);
    if (!room) return null;

    room.state = {
      ...room.state,
      ...updates,
      lastUpdated: Date.now(),
    };

    return room.state;
  }

  transferHost(channelId: string, newHostId: string): boolean {
    const room = this.rooms.get(channelId);
    if (!room || !room.users.has(newHostId)) return false;

    room.state.hostId = newHostId;
    room.state.lastUpdated = Date.now();
    return true;
  }

  getUsersList(room: Room): RoomUser[] {
    return Array.from(room.users.values());
  }
}
