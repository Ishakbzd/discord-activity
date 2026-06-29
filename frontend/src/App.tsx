import { useEffect, useState } from 'react';
import { initDiscord, isDevMode, type DiscordContext } from './discord/sdk';
import { WatchPage } from './pages/WatchPage';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-darker">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-discord-blurple border-t-transparent rounded-full animate-spin" />
        <p className="text-discord-muted text-sm">Connecting to Discord...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-darker p-4">
      <div className="bg-discord-sidebar rounded-lg p-6 max-w-md text-center">
        <p className="text-discord-red font-medium mb-2">Something went wrong</p>
        <p className="text-sm text-discord-muted">{message}</p>
      </div>
    </div>
  );
}

function DevBanner() {
  return (
    <div className="bg-discord-yellow/10 border-b border-discord-yellow/20 px-4 py-1.5 text-center text-xs text-discord-yellow">
      Development mode — running outside Discord Activity
    </div>
  );
}

export default function App() {
  const [context, setContext] = useState<DiscordContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initDiscord()
      .then(setContext)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;
  if (!context) return <ErrorScreen message="Failed to initialize" />;

  return (
    <>
      {isDevMode() && <DevBanner />}
      <WatchPage context={context} />
    </>
  );
}
