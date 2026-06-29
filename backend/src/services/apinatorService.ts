import { Apinator as ApinatorServer } from '@apinator/server';

let apinator: ApinatorServer | null = null;

export function getApinator(): ApinatorServer {
  if (!apinator) {
    const appId = process.env.APINATOR_APP_ID ?? '';
    const key = process.env.APINATOR_KEY ?? '';
    const secret = process.env.APINATOR_SECRET ?? '';
    const cluster = process.env.APINATOR_CLUSTER ?? 'eu';

    if (!appId || !key || !secret) {
      throw new Error('APINATOR_APP_ID, APINATOR_KEY, and APINATOR_SECRET must be set');
    }

    apinator = new ApinatorServer({ appId, key, secret, cluster: cluster as 'eu' | 'us' });
  }
  return apinator;
}

export function getChannelName(channelId: string): string {
  return `room-${channelId}`;
}
