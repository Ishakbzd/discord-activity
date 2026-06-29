import { useCallback, useEffect, useRef, useState } from 'react';
import type { DiscordContext } from '../discord/sdk';
import { useDriftCorrection, useRoomSync } from '../hooks/useRoomSync';
import { useVideoPlayer } from '../player/useVideoPlayer';
import { Controls } from '../components/Controls';
import { StatusBar } from '../components/StatusBar';
import { StreamInput } from '../components/StreamInput';
import { UserList } from '../components/UserList';

interface WatchPageProps {
  context: DiscordContext;
}

export function WatchPage({ context }: WatchPageProps) {
  const { channelId, user } = context;
  const {
    state,
    users,
    isHost,
    connected,
    error,
    play,
    pause,
    seek,
    changeStream,
    changePlaybackRate,
    transferHost,
  } = useRoomSync({
    channelId,
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
  });

  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);
  const playerAreaRef = useRef<HTMLDivElement>(null);

  const videoRef = useVideoPlayer({
    state,
    isHost,
    onTimeUpdate: setLocalTime,
    onPlay: play,
    onPause: (time) => pause(time),
    onSeek: seek,
    onRateChange: changePlaybackRate,
  });

  useDriftCorrection(videoRef, state, isHost);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateDuration = () => {
      setDuration(isFinite(video.duration) ? video.duration : 0);
    };

    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('durationchange', updateDuration);
    return () => {
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('durationchange', updateDuration);
    };
  }, [videoRef, state?.streamUrl]);

  useEffect(() => {
    const area = playerAreaRef.current;
    if (!area || !isHost || state?.streamUrl) return;

    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text') ?? '';
      const url = text.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) return;

      e.preventDefault();
      changeStream(url);
      setPasteFeedback('Stream loaded!');
      setTimeout(() => setPasteFeedback(null), 2000);
    };

    area.addEventListener('paste', handlePaste);
    return () => area.removeEventListener('paste', handlePaste);
  }, [isHost, state?.streamUrl, changeStream]);

  const handlePlay = useCallback(() => play(), [play]);
  const handlePause = useCallback(() => {
    const time = videoRef.current?.currentTime ?? 0;
    pause(time);
  }, [pause, videoRef]);

  const handleSeek = useCallback(
    (time: number) => {
      if (videoRef.current) videoRef.current.currentTime = time;
      seek(time);
    },
    [seek, videoRef]
  );

  return (
    <div className="min-h-screen flex flex-col bg-discord-darker">
      <header className="px-4 py-3 border-b border-discord-dark flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-discord-blurple flex items-center justify-center">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 3a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12zm-8.5 3.5l-1 5.5 5.5-1-5.5-4.5z" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-semibold">WatchTogether</h1>
          <p className="text-xs text-discord-muted">Synchronized viewing</p>
        </div>
      </header>

      <StatusBar connected={connected} isHost={isHost} error={error} />

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div
            ref={playerAreaRef}
            className="relative aspect-video bg-black rounded-lg overflow-hidden"
            tabIndex={isHost && !state?.streamUrl ? 0 : undefined}
          >
            {state?.streamUrl ? (
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                crossOrigin="anonymous"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-discord-muted gap-3 px-4">
                <svg className="w-20 h-20 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 3a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12zm-8.5 3.5l-1 5.5 5.5-1-5.5-4.5z" />
                </svg>
                <p className="text-base font-medium">No stream loaded</p>
                {isHost ? (
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm text-discord-text/60">Paste a stream URL to start watching</p>
                    <p className="text-xs text-discord-muted">Ctrl+V anywhere on this area</p>
                  </div>
                ) : (
                  <p className="text-xs text-discord-muted">Waiting for the host to load a stream...</p>
                )}
                {pasteFeedback && (
                  <span className="text-sm text-discord-green font-medium animate-pulse">
                    {pasteFeedback}
                  </span>
                )}
              </div>
            )}
          </div>

          <StreamInput
            streamUrl={state?.streamUrl ?? ''}
            isHost={isHost}
            onSubmit={changeStream}
          />

          <Controls
            playing={state?.playing ?? false}
            currentTime={localTime}
            duration={duration}
            playbackRate={state?.playbackRate ?? 1}
            isHost={isHost}
            hasStream={!!state?.streamUrl}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            onRateChange={changePlaybackRate}
          />
        </div>

        <aside className="lg:w-64 shrink-0 bg-discord-sidebar rounded-lg p-3">
          <UserList
            users={users}
            hostId={state?.hostId ?? ''}
            currentUserId={user.id}
            isHost={isHost}
            onTransferHost={transferHost}
          />
        </aside>
      </main>
    </div>
  );
}
