import { DiscordSDK } from '@discord/embedded-app-sdk';

const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID as string | undefined;

let discordSdk: DiscordSDK | null = null;

export interface DiscordUser {
  id: string;
  username: string;
  avatar?: string;
}

export interface DiscordContext {
  channelId: string;
  user: DiscordUser;
}

export function isDevMode(): boolean {
  return !clientId || window.location.hostname === 'localhost';
}

export async function initDiscord(): Promise<DiscordContext> {
  if (isDevMode()) {
    return {
      channelId: 'dev-channel',
      user: {
        id: `dev-user-${Date.now()}`,
        username: 'Dev User',
      },
    };
  }

  discordSdk = new DiscordSDK(clientId!);
  await discordSdk.ready();

  const { code } = await discordSdk.commands.authorize({
    client_id: clientId!,
    response_type: 'code',
    state: '',
    prompt: 'none',
    scope: ['identify'],
  });

  const tokenResponse = await fetch('/.proxy/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to authenticate with Discord');
  }

  const { access_token } = (await tokenResponse.json()) as {
    access_token: string;
  };

  const auth = await discordSdk.commands.authenticate({ access_token });
  if (!auth?.user) {
    throw new Error('Discord authentication failed');
  }

  return {
    channelId: extractChannelId(discordSdk.instanceId),
    user: {
      id: auth.user.id,
      username: auth.user.username,
      avatar: auth.user.avatar ?? undefined,
    },
  };
}

function extractChannelId(instanceId: string): string {
  const parts = instanceId.split(':');
  return parts.length >= 2 ? parts[1] : instanceId || 'default-channel';
}

export function getDiscordSdk(): DiscordSDK | null {
  return discordSdk;
}
