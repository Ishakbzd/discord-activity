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
export declare const DRIFT_THRESHOLD_MS = 500;
export declare const CLIENT_EVENTS: {
    readonly JOIN_ROOM: "joinRoom";
    readonly LEAVE_ROOM: "leaveRoom";
    readonly PLAY: "play";
    readonly PAUSE: "pause";
    readonly SEEK: "seek";
    readonly CHANGE_STREAM: "changeStream";
    readonly CHANGE_PLAYBACK_RATE: "changePlaybackRate";
    readonly TRANSFER_HOST: "transferHost";
    readonly PING: "ping";
};
export declare const SERVER_EVENTS: {
    readonly SYNC_STATE: "syncState";
    readonly ROOM_UPDATED: "roomUpdated";
    readonly USER_JOINED: "userJoined";
    readonly USER_LEFT: "userLeft";
    readonly HOST_CHANGED: "hostChanged";
    readonly PONG: "pong";
    readonly ERROR: "error";
};
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
