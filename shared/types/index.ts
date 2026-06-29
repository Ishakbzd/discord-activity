export interface RoomState {
  streamUrl: string;
  playing: boolean;
  currentTime: number;
  playbackRate: number;
  hostId: string;
  lastUpdated: number;
}

export interface RoomUser {
  id: string;
  username: string;
  avatar?: string;
}

export interface RoomInfo {
  channelId: string;
  state: RoomState;
  users: RoomUser[];
}

export const DRIFT_THRESHOLD_MS = 500;

export const CLIENT_EVENTS = {
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  PLAY: 'play',
  PAUSE: 'pause',
  SEEK: 'seek',
  CHANGE_STREAM: 'changeStream',
  CHANGE_PLAYBACK_RATE: 'changePlaybackRate',
  TRANSFER_HOST: 'transferHost',
  PING: 'ping',
} as const;

export const SERVER_EVENTS = {
  SYNC_STATE: 'syncState',
  ROOM_UPDATED: 'roomUpdated',
  USER_JOINED: 'userJoined',
  USER_LEFT: 'userLeft',
  HOST_CHANGED: 'hostChanged',
  PONG: 'pong',
  ERROR: 'error',
} as const;

export interface JoinRoomPayload {
  channelId: string;
  userId: string;
  username: string;
  avatar?: string;
}

export interface SeekPayload {
  currentTime: number;
}

export interface ChangeStreamPayload {
  streamUrl: string;
}

export interface ChangePlaybackRatePayload {
  playbackRate: number;
}

export interface TransferHostPayload {
  newHostId: string;
}
