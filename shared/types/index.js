"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER_EVENTS = exports.CLIENT_EVENTS = exports.DRIFT_THRESHOLD_MS = void 0;
exports.DRIFT_THRESHOLD_MS = 500;
exports.CLIENT_EVENTS = {
    JOIN_ROOM: 'joinRoom',
    LEAVE_ROOM: 'leaveRoom',
    PLAY: 'play',
    PAUSE: 'pause',
    SEEK: 'seek',
    CHANGE_STREAM: 'changeStream',
    CHANGE_PLAYBACK_RATE: 'changePlaybackRate',
    TRANSFER_HOST: 'transferHost',
    PING: 'ping',
};
exports.SERVER_EVENTS = {
    SYNC_STATE: 'syncState',
    ROOM_UPDATED: 'roomUpdated',
    USER_JOINED: 'userJoined',
    USER_LEFT: 'userLeft',
    HOST_CHANGED: 'hostChanged',
    PONG: 'pong',
    ERROR: 'error',
};
