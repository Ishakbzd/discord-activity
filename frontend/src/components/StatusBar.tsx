interface StatusBarProps {
  connected: boolean;
  isHost: boolean;
  error: string | null;
}

export function StatusBar({ connected, isHost, error }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 text-xs">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${connected ? 'bg-discord-green' : 'bg-discord-red'}`}
          />
          {connected ? 'Connected' : 'Reconnecting...'}
        </span>
        {isHost && (
          <span className="text-discord-yellow font-medium">You are the host</span>
        )}
      </div>
      {error && <span className="text-discord-red">{error}</span>}
    </div>
  );
}
