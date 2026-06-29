export interface PlaylistChannel {
  name: string;
  url: string;
  logo?: string;
  group?: string;
  tvgId?: string;
}

const EXTINF_RE = /#EXTINF:(?:\d+(?:\.\d+)?)(.*)/;
const ATTR_RE = /(\w+-\w+|\w+)="([^"]*)"/g;
const NAME_RE = /,\s*(.+)$/;

export function parseM3u(content: string): PlaylistChannel[] {
  const channels: PlaylistChannel[] = [];
  const lines = content.split(/\r?\n/);
  let current: Partial<PlaylistChannel> | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line === '#EXTM3U') continue;

    if (line.startsWith('#EXTINF:')) {
      const m = line.match(EXTINF_RE);
      if (!m) { current = null; continue; }

      const attrs: Record<string, string> = {};
      let match: RegExpExecArray | null;
      while ((match = ATTR_RE.exec(m[1])) !== null) {
        attrs[match[1]] = match[2];
      }

      const nameMatch = line.match(NAME_RE);
      current = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown',
        logo: attrs['tvg-logo'],
        group: attrs['group-title'],
        tvgId: attrs['tvg-id'],
      };
    } else if (line.startsWith('#EXTVLCOPT:') || line.startsWith('#')) {
      continue;
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (current) {
        channels.push({ ...current, url: line } as PlaylistChannel);
      }
      current = null;
    } else {
      current = null;
    }
  }

  return channels;
}

export function isM3uUrl(url: string): boolean {
  return /\.m3u(?:8)?(?:\?.*)?$/i.test(url) || url.includes('iptv');
}

export function groupChannels(channels: PlaylistChannel[]): Map<string, PlaylistChannel[]> {
  const groups = new Map<string, PlaylistChannel[]>();
  for (const ch of channels) {
    const key = ch.group || 'Other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ch);
  }
  return groups;
}
