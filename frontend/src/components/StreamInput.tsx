interface StreamInputProps {
  streamUrl: string;
  isHost: boolean;
  onSubmit: (url: string) => void;
}

export function StreamInput({ streamUrl, isHost, onSubmit }: StreamInputProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('streamUrl') as HTMLInputElement;
    const url = input.value.trim();
    if (url) onSubmit(url);
  };

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
    <form onSubmit={handleSubmit} className="flex gap-2 px-4 py-3 bg-discord-dark rounded-lg">
      <input
        name="streamUrl"
        type="url"
        defaultValue={streamUrl}
        placeholder="Paste HLS (.m3u8), MP4, or WebM URL..."
        className="flex-1 bg-discord-card text-sm px-3 py-2 rounded border border-discord-hover focus:outline-none focus:border-discord-blurple placeholder:text-discord-muted"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-discord-blurple hover:bg-[#4752C4] text-sm font-medium rounded transition-colors"
      >
        Load
      </button>
    </form>
  );
}
