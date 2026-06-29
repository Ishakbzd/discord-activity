import { useCallback, useEffect, useRef, useState } from 'react';
import type { RoomState, RoomUser } from '@shared';
import { DRIFT_THRESHOLD_MS } from '@shared';
import { roomService } from '../socket/socketService';

interface UseRoomSyncOptions {
  channelId: string;
  userId: string;
  username: string;
  avatar?: string;
}

interface UseRoomSyncReturn {
  state: RoomState | null;
  users: RoomUser[];
  isHost: boolean;
  connected: boolean;
  error: string | null;
  play: () => void;
  pause: (currentTime?: number) => void;
  seek: (time: number) => void;
  changeStream: (url: string) => void;
  changePlaybackRate: (rate: number) => void;
  transferHost: (userId: string) => void;
}

export function useRoomSync(options: UseRoomSyncOptions): UseRoomSyncReturn {
  const { channelId, userId, username, avatar } = options;
  const [state, setState] = useState<RoomState | null>(null);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (joinedRef.current) return;
    joinedRef.current = true;

    const cleanups = [
      roomService.onRoomUpdated(({ state: s }) => {
        setState(s);
      }),
      roomService.onUserJoined(({ user }) => {
        setUsers((prev) => {
          if (prev.some((u) => u.id === user.id)) return prev;
          return [...prev, user];
        });
      }),
      roomService.onUserLeft(({ userId: leftId }) => {
        setUsers((prev) => prev.filter((u) => u.id !== leftId));
      }),
      roomService.onHostChanged(({ hostId }) => {
        setIsHost(hostId === userId);
        setState((prev) => (prev ? { ...prev, hostId } : prev));
      }),
      roomService.onError(({ message }) => setError(message)),
    ];

    roomService
      .join({ channelId, userId, username, avatar })
      .then((data) => {
        setState(data.state);
        setUsers(data.users);
        setIsHost(data.isHost);
        setConnected(true);
        setError(null);
      })
      .catch((err: Error) => {
        setError(err.message);
        setConnected(false);
      });

    return () => {
      cleanups.forEach((fn) => fn());
      roomService.leave(channelId, userId);
      joinedRef.current = false;
    };
  }, [channelId, userId, username, avatar]);

  return {
    state,
    users,
    isHost,
    connected,
    error,
    play: useCallback(() => roomService.play(channelId, userId), [channelId, userId]),
    pause: useCallback(
      (t?: number) => roomService.pause(channelId, userId, t),
      [channelId, userId]
    ),
    seek: useCallback(
      (t: number) => roomService.seek(channelId, userId, t),
      [channelId, userId]
    ),
    changeStream: useCallback(
      (url: string) => roomService.changeStream(channelId, userId, url),
      [channelId, userId]
    ),
    changePlaybackRate: useCallback(
      (rate: number) => roomService.changePlaybackRate(channelId, userId, rate),
      [channelId, userId]
    ),
    transferHost: useCallback(
      (id: string) => roomService.transferHost(channelId, userId, id),
      [channelId, userId]
    ),
  };
}

export function useDriftCorrection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  state: RoomState | null,
  isHost: boolean
): void {
  useEffect(() => {
    if (!state || isHost) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || !state.playing) return;

      const serverTime =
        state.currentTime + (Date.now() - state.lastUpdated) / 1000;
      const drift = Math.abs(video.currentTime - serverTime) * 1000;

      if (drift > DRIFT_THRESHOLD_MS) {
        video.currentTime = serverTime;
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [videoRef, state, isHost]);
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
