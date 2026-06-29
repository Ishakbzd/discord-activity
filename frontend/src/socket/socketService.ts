import { io, type Socket } from 'socket.io-client';
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  type RoomState,
  type RoomUser,
} from '@shared';

const API_URL = import.meta.env.VITE_API_URL ?? undefined;

export type SyncStateHandler = (data: {
  state: RoomState;
  users: RoomUser[];
  isHost: boolean;
}) => void;

export type RoomUpdatedHandler = (data: { state: RoomState }) => void;
export type UserJoinedHandler = (data: { user: RoomUser }) => void;
export type UserLeftHandler = (data: { userId: string }) => void;
export type HostChangedHandler = (data: { hostId: string }) => void;
export type ErrorHandler = (data: { message: string }) => void;

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      this.reconnectAttempts++;
    });

    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  joinRoom(payload: {
    channelId: string;
    userId: string;
    username: string;
    avatar?: string;
  }): void {
    this.socket?.emit(CLIENT_EVENTS.JOIN_ROOM, payload);
  }

  leaveRoom(): void {
    this.socket?.emit(CLIENT_EVENTS.LEAVE_ROOM);
  }

  play(): void {
    this.socket?.emit(CLIENT_EVENTS.PLAY);
  }

  pause(currentTime?: number): void {
    this.socket?.emit(CLIENT_EVENTS.PAUSE, { currentTime });
  }

  seek(currentTime: number): void {
    this.socket?.emit(CLIENT_EVENTS.SEEK, { currentTime });
  }

  changeStream(streamUrl: string): void {
    this.socket?.emit(CLIENT_EVENTS.CHANGE_STREAM, { streamUrl });
  }

  changePlaybackRate(playbackRate: number): void {
    this.socket?.emit(CLIENT_EVENTS.CHANGE_PLAYBACK_RATE, { playbackRate });
  }

  transferHost(newHostId: string): void {
    this.socket?.emit(CLIENT_EVENTS.TRANSFER_HOST, { newHostId });
  }

  ping(): void {
    this.socket?.emit(CLIENT_EVENTS.PING);
  }

  onSyncState(handler: SyncStateHandler): () => void {
    this.socket?.on(SERVER_EVENTS.SYNC_STATE, handler);
    return () => this.socket?.off(SERVER_EVENTS.SYNC_STATE, handler);
  }

  onRoomUpdated(handler: RoomUpdatedHandler): () => void {
    this.socket?.on(SERVER_EVENTS.ROOM_UPDATED, handler);
    return () => this.socket?.off(SERVER_EVENTS.ROOM_UPDATED, handler);
  }

  onUserJoined(handler: UserJoinedHandler): () => void {
    this.socket?.on(SERVER_EVENTS.USER_JOINED, handler);
    return () => this.socket?.off(SERVER_EVENTS.USER_JOINED, handler);
  }

  onUserLeft(handler: UserLeftHandler): () => void {
    this.socket?.on(SERVER_EVENTS.USER_LEFT, handler);
    return () => this.socket?.off(SERVER_EVENTS.USER_LEFT, handler);
  }

  onHostChanged(handler: HostChangedHandler): () => void {
    this.socket?.on(SERVER_EVENTS.HOST_CHANGED, handler);
    return () => this.socket?.off(SERVER_EVENTS.HOST_CHANGED, handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.socket?.on(SERVER_EVENTS.ERROR, handler);
    return () => this.socket?.off(SERVER_EVENTS.ERROR, handler);
  }

  onPong(handler: (data: { timestamp: number }) => void): () => void {
    this.socket?.on(SERVER_EVENTS.PONG, handler);
    return () => this.socket?.off(SERVER_EVENTS.PONG, handler);
  }
}

export const socketService = new SocketService();
