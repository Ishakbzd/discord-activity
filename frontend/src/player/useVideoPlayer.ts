import Hls from 'hls.js';
import { useEffect, useRef } from 'react';
import type { RoomState } from '@shared';

interface VideoPlayerProps {
  state: RoomState | null;
  isHost: boolean;
  onTimeUpdate: (time: number) => void;
  onPlay: () => void;
  onPause: (time: number) => void;
  onSeek: (time: number) => void;
  onRateChange: (rate: number) => void;
}

export function useVideoPlayer({
  state,
  isHost,
  onTimeUpdate,
  onPlay,
  onPause,
  onSeek,
  onRateChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const suppressEvents = useRef(false);
  const lastStateRef = useRef<RoomState | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !state?.streamUrl) return;

    if (lastStateRef.current?.streamUrl !== state.streamUrl) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const url = state.streamUrl;
      const isHls = url.includes('.m3u8');

      if (isHls && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.error('HLS fatal error:', data);
          }
        });
        hlsRef.current = hls;
      } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else {
        video.src = url;
      }

      video.load();
    }

    lastStateRef.current = state;
  }, [state?.streamUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !state) return;

    suppressEvents.current = true;

    if (Math.abs(video.playbackRate - state.playbackRate) > 0.01) {
      video.playbackRate = state.playbackRate;
    }

    if (!isHost) {
      const serverTime =
        state.currentTime + (Date.now() - state.lastUpdated) / 1000;

      if (Math.abs(video.currentTime - serverTime) > 0.5) {
        video.currentTime = serverTime;
      }

      if (state.playing && video.paused) {
        video.play().catch(() => {});
      } else if (!state.playing && !video.paused) {
        video.pause();
      }
    }

    requestAnimationFrame(() => {
      suppressEvents.current = false;
    });
  }, [state, isHost]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isHost) return;

    const handlePlay = () => {
      if (suppressEvents.current) return;
      onPlay();
    };

    const handlePause = () => {
      if (suppressEvents.current) return;
      onPause(video.currentTime);
    };

    const handleSeeked = () => {
      if (suppressEvents.current) return;
      onSeek(video.currentTime);
    };

    const handleRateChange = () => {
      if (suppressEvents.current) return;
      onRateChange(video.playbackRate);
    };

    const handleTimeUpdate = () => {
      if (suppressEvents.current) return;
      onTimeUpdate(video.currentTime);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('ratechange', handleRateChange);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('ratechange', handleRateChange);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isHost, onPlay, onPause, onSeek, onRateChange, onTimeUpdate]);

  useEffect(() => {
    return () => {
      hlsRef.current?.destroy();
    };
  }, []);

  return videoRef;
}
