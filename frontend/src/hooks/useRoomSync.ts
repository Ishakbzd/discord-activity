import { useCallback, useEffect, useRef, useState } from 'react';
import type { RoomState, RoomUser } from '@shared';
import { DRIFT_THRESHOLD_MS } from '@shared';
import { socketService } from '../socket/socketService';

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
    const socket = socketService.connect();

    const onConnect = () => {
      setConnected(true);
      if (!joinedRef.current) {
        socketService.joinRoom({ channelId, userId, username, avatar });
        joinedRef.current = true;
      }
    };

    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) onConnect();

    const cleanups = [
      socketService.onSyncState(({ state: s, users: u, isHost: h }) => {
        setState(s);
        setUsers(u);
        setIsHost(h);
        setError(null);
      }),
      socketService.onRoomUpdated(({ state: s }) => {
        setState(s);
      }),
      socketService.onUserJoined(({ user }) => {
        setUsers((prev) => {
          if (prev.some((u) => u.id === user.id)) return prev;
          return [...prev, user];
        });
      }),
      socketService.onUserLeft(({ userId: leftId }) => {
        setUsers((prev) => prev.filter((u) => u.id !== leftId));
      }),
      socketService.onHostChanged(({ hostId }) => {
        setIsHost(hostId === userId);
        setState((prev) => (prev ? { ...prev, hostId } : prev));
      }),
      socketService.onError(({ message }) => setError(message)),
    ];

    const pingInterval = setInterval(() => socketService.ping(), 30000);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      cleanups.forEach((fn) => fn());
      clearInterval(pingInterval);
      socketService.leaveRoom();
      joinedRef.current = false;
    };
  }, [channelId, userId, username, avatar]);

  return {
    state,
    users,
    isHost,
    connected,
    error,
    play: useCallback(() => socketService.play(), []),
    pause: useCallback((t?: number) => socketService.pause(t), []),
    seek: useCallback((t: number) => socketService.seek(t), []),
    changeStream: useCallback((url: string) => socketService.changeStream(url), []),
    changePlaybackRate: useCallback(
      (rate: number) => socketService.changePlaybackRate(rate),
      []
    ),
    transferHost: useCallback(
      (id: string) => socketService.transferHost(id),
      []
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
