import { Apinator, Channel } from '@apinator/client';
import type { RoomState, RoomUser } from '@shared';

const API_URL = import.meta.env.VITE_API_URL ?? '';

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

function getChannelName(channelId: string): string {
  return `room-${channelId}`;
}

class RoomService {
  private client: Apinator | null = null;
  private channel: Channel | null = null;
  private currentChannelId: string | null = null;

  private syncStateHandlers: SyncStateHandler[] = [];
  private roomUpdatedHandlers: RoomUpdatedHandler[] = [];
  private userJoinedHandlers: UserJoinedHandler[] = [];
  private userLeftHandlers: UserLeftHandler[] = [];
  private hostChangedHandlers: HostChangedHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];

  private onRoomUpdatedBound: ((data: unknown) => void) | null = null;
  private onHostChangedBound: ((data: unknown) => void) | null = null;
  private onUserLeftBound: ((data: unknown) => void) | null = null;

  private emitRoomUpdated(data: { state: RoomState }) {
    this.roomUpdatedHandlers.forEach((h) => h(data));
  }

  private emitHostChanged(data: { hostId: string }) {
    this.hostChangedHandlers.forEach((h) => h(data));
  }

  private emitUserLeft(data: { userId: string }) {
    this.userLeftHandlers.forEach((h) => h(data));
  }

  private connectApinator(channelId: string): void {
    if (this.client && this.currentChannelId === channelId) return;

    this.disconnectApinator();

    const appKey = import.meta.env.VITE_APINATOR_KEY;
    const cluster = import.meta.env.VITE_APINATOR_CLUSTER ?? 'us';
    if (!appKey) return;

    this.client = new Apinator({ appKey, cluster });
    this.currentChannelId = channelId;

    this.onRoomUpdatedBound = (data: unknown) => {
      this.emitRoomUpdated(data as { state: RoomState });
    };
    this.onHostChangedBound = (data: unknown) => {
      this.emitHostChanged(data as { hostId: string });
    };
    this.onUserLeftBound = (data: unknown) => {
      this.emitUserLeft(data as { userId: string });
    };

    this.client.bind('connected', () => {
      if (!this.client) return;
      this.channel = this.client.subscribe(getChannelName(channelId));
      this.channel.bind('room-updated', this.onRoomUpdatedBound!);
      this.channel.bind('host-changed', this.onHostChangedBound!);
      this.channel.bind('user-left', this.onUserLeftBound!);
    });

    this.client.connect();
  }

  private disconnectApinator(): void {
    if (this.channel) {
      this.channel.unbindAll();
      this.channel = null;
    }
    if (this.client) {
      if (this.currentChannelId) {
        try {
          this.client.unsubscribe(getChannelName(this.currentChannelId));
        } catch { /* ignore */ }
      }
      this.client.disconnect();
    }
    this.client = null;
    this.currentChannelId = null;
    this.onRoomUpdatedBound = null;
    this.onHostChangedBound = null;
    this.onUserLeftBound = null;
  }

  async join(params: {
    channelId: string;
    userId: string;
    username: string;
    avatar?: string;
  }): Promise<{ state: RoomState; users: RoomUser[]; isHost: boolean }> {
    const response = await fetch(`${API_URL}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Failed to join room' }));
      throw new Error(err.error ?? 'Failed to join room');
    }

    const data = await response.json();
    this.connectApinator(params.channelId);
    return data;
  }

  async leave(channelId: string, userId: string): Promise<void> {
    this.disconnectApinator();
    await fetch(`${API_URL}/api/rooms/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId, userId }),
    }).catch(() => {});
  }

  private async sendAction(
    action: string,
    body: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const response = await fetch(`${API_URL}/api/rooms/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error ?? 'Request failed');
    }

    return response.json();
  }

  async play(channelId: string, userId: string): Promise<void> {
    await this.sendAction('play', { channelId, userId });
  }

  async pause(channelId: string, userId: string, currentTime?: number): Promise<void> {
    await this.sendAction('pause', { channelId, userId, currentTime });
  }

  async seek(channelId: string, userId: string, currentTime: number): Promise<void> {
    await this.sendAction('seek', { channelId, userId, currentTime });
  }

  async changeStream(channelId: string, userId: string, streamUrl: string): Promise<void> {
    await this.sendAction('change-stream', { channelId, userId, streamUrl });
  }

  async changePlaybackRate(channelId: string, userId: string, playbackRate: number): Promise<void> {
    await this.sendAction('change-playback-rate', { channelId, userId, playbackRate });
  }

  async changeBrowse(channelId: string, userId: string, browseUrl: string): Promise<void> {
    await this.sendAction('change-browse', { channelId, userId, browseUrl });
  }

  async transferHost(channelId: string, userId: string, newHostId: string): Promise<void> {
    await this.sendAction('transfer-host', { channelId, userId, newHostId });
  }

  onSyncState(handler: SyncStateHandler): () => void {
    this.syncStateHandlers.push(handler);
    return () => {
      this.syncStateHandlers = this.syncStateHandlers.filter((h) => h !== handler);
    };
  }

  onRoomUpdated(handler: RoomUpdatedHandler): () => void {
    this.roomUpdatedHandlers.push(handler);
    return () => {
      this.roomUpdatedHandlers = this.roomUpdatedHandlers.filter((h) => h !== handler);
    };
  }

  onUserJoined(handler: UserJoinedHandler): () => void {
    this.userJoinedHandlers.push(handler);
    return () => {
      this.userJoinedHandlers = this.userJoinedHandlers.filter((h) => h !== handler);
    };
  }

  onUserLeft(handler: UserLeftHandler): () => void {
    this.userLeftHandlers.push(handler);
    return () => {
      this.userLeftHandlers = this.userLeftHandlers.filter((h) => h !== handler);
    };
  }

  onHostChanged(handler: HostChangedHandler): () => void {
    this.hostChangedHandlers.push(handler);
    return () => {
      this.hostChangedHandlers = this.hostChangedHandlers.filter((h) => h !== handler);
    };
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter((h) => h !== handler);
    };
  }
}

export const roomService = new RoomService();
