import { useCallback, useEffect, useRef, useState } from 'react';

interface BrowsePanelProps {
  currentUrl: string;
  isHost: boolean;
  onChangeUrl: (url: string) => void;
}

export function BrowsePanel({ currentUrl, isHost, onChangeUrl }: BrowsePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text') ?? '';
      const url = text.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) return;

      e.preventDefault();
      if (inputRef.current) inputRef.current.value = url;
      onChangeUrl(url);
      setFeedback('URL synced!');
      setTimeout(() => setFeedback(null), 2000);
    },
    [onChangeUrl]
  );

  const handleSubmit = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const url = input.value.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) return;
    onChangeUrl(url);
    setFeedback('URL synced!');
    setTimeout(() => setFeedback(null), 2000);
  }, [onChangeUrl]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input || !isHost) return;
    input.addEventListener('paste', handlePaste);
    return () => input.removeEventListener('paste', handlePaste);
  }, [isHost, handlePaste]);

  if (isHost) {
    return (
      <div className="bg-discord-dark rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="url"
            defaultValue={currentUrl}
            placeholder="Paste or type a URL to browse..."
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="flex-1 bg-discord-card text-sm px-3 py-2 rounded border border-discord-hover focus:outline-none focus:border-discord-blurple placeholder:text-discord-muted"
          />
          <button
            onClick={handleSubmit}
            className="bg-discord-blurple hover:bg-[#4752C4] text-sm px-3 py-2 rounded font-medium transition-colors"
          >
            Go
          </button>
          {feedback && (
            <span className="text-xs text-discord-green font-medium shrink-0 animate-pulse">{feedback}</span>
          )}
        </div>
        <p className="text-xs text-discord-muted mt-1.5">Paste a URL (Ctrl+V) to share it with everyone</p>
      </div>
    );
  }

  if (!currentUrl) {
    return (
      <div className="bg-discord-dark rounded-lg px-4 py-3">
        <p className="text-sm text-discord-muted">Waiting for the host to share a URL...</p>
      </div>
    );
  }

  return (
    <div className="bg-discord-dark rounded-lg px-4 py-3">
      <div className="flex items-center gap-2">
        <p className="text-sm text-discord-text truncate flex-1">{currentUrl}</p>
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-discord-blurple hover:bg-[#4752C4] text-sm px-3 py-2 rounded font-medium shrink-0 transition-colors"
        >
          Open
        </a>
      </div>
      <p className="text-xs text-discord-muted mt-1.5">The host is viewing this page</p>
    </div>
  );
}
