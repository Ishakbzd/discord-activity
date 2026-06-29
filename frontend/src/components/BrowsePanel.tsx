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

  return (
    <>
      <div className="bg-discord-dark rounded-lg px-4 py-3">
        {isHost ? (
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
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm text-discord-text truncate flex-1">{currentUrl || 'Waiting for host to share a URL...'}</p>
            {currentUrl && (
              <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="bg-discord-blurple hover:bg-[#4752C4] text-sm px-3 py-2 rounded font-medium shrink-0 transition-colors">Open</a>
            )}
          </div>
        )}
        <p className="text-xs text-discord-muted mt-1.5">{isHost ? 'Paste a URL (Ctrl+V) to share it with everyone' : 'The host is viewing this page'}</p>
      </div>

      {currentUrl && (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {currentUrl.startsWith('https://') || currentUrl.startsWith('http://') ? (
            <iframe
              src={currentUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              title="Browser"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-discord-muted text-sm">
              Invalid URL
            </div>
          )}
        </div>
      )}
    </>
  );
}
