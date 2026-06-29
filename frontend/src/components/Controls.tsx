import { formatTime } from '../hooks/useRoomSync';

interface ControlsProps {
  playing: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isHost: boolean;
  hasStream: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onRateChange: (rate: number) => void;
}

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function Controls({
  playing,
  currentTime,
  duration,
  playbackRate,
  isHost,
  hasStream,
  onPlay,
  onPause,
  onSeek,
  onRateChange,
}: ControlsProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isHost) return;
    const time = (parseFloat(e.target.value) / 100) * duration;
    onSeek(time);
  };

  return (
    <div className="flex flex-col gap-2 px-4 py-3 bg-discord-dark rounded-lg">
      <div className="flex items-center gap-3">
        <button
          disabled={!isHost || !hasStream}
          onClick={playing ? onPause : onPlay}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-discord-blurple hover:bg-[#4752C4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            disabled={!isHost || !hasStream}
            className="w-full h-1 accent-discord-blurple cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          />
          <div className="flex justify-between text-xs text-discord-muted">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : 'LIVE'}</span>
          </div>
        </div>

        {isHost && (
          <select
            value={playbackRate}
            onChange={(e) => onRateChange(parseFloat(e.target.value))}
            disabled={!hasStream}
            className="bg-discord-card text-sm px-2 py-1 rounded border border-discord-hover focus:outline-none focus:border-discord-blurple disabled:opacity-40"
          >
            {RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate}x
              </option>
            ))}
          </select>
        )}
      </div>

      {!isHost && (
        <p className="text-xs text-discord-muted text-center">
          Only the host can control playback
        </p>
      )}
    </div>
  );
}
