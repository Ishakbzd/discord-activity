import { useCallback, useEffect, useRef, useState } from 'react';
import { isM3uUrl } from '../utils/playlistParser';

interface StreamInputProps {
  streamUrl: string;
  isHost: boolean;
  onSubmit: (url: string) => void;
  onPlaylistPaste?: (url: string) => void;
}

export function StreamInput({ streamUrl, isHost, onSubmit, onPlaylistPaste }: StreamInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text') ?? '';
      const url = text.trim();
      if (!url) return;

      const isValid = url.startsWith('http://') || url.startsWith('https://');
      if (!isValid) return;

      e.preventDefault();
      if (inputRef.current) inputRef.current.value = url;

      if (isM3uUrl(url)) {
        onPlaylistPaste?.(url);
        return;
      }

      onSubmit(url);
      setFeedback('Stream loaded!');
      setTimeout(() => setFeedback(null), 2000);
    },
    [onSubmit, onPlaylistPaste]
  );

  useEffect(() => {
    const input = inputRef.current;
    if (!input || !isHost) return;
    input.addEventListener('paste', handlePaste);
    return () => input.removeEventListener('paste', handlePaste);
  }, [isHost, handlePaste]);

  if (!isHost) {
    return (
      <div className="px-4 py-3 bg-discord-dark rounded-lg">
        <p className="text-sm text-discord-muted truncate">
          {streamUrl || 'Waiting for host to set a stream...'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative px-4 py-3 bg-discord-dark rounded-lg">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="url"
          defaultValue={streamUrl}
          placeholder="Paste HLS (.m3u8), MP4, WebM, or IPTV playlist (.m3u) URL..."
          readOnly
          className="flex-1 bg-discord-card text-sm px-3 py-2 rounded border border-discord-hover cursor-pointer focus:outline-none focus:border-discord-blurple placeholder:text-discord-muted"
        />
        {feedback && (
          <span className="text-xs text-discord-green font-medium shrink-0 animate-pulse">
            {feedback}
          </span>
        )}
      </div>
      <p className="text-xs text-discord-muted mt-1.5">Click the input above and paste (Ctrl+V) to load a stream</p>
    </div>
  );
}
