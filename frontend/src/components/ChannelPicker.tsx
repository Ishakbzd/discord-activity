import { useMemo, useState } from 'react';
import type { PlaylistChannel } from '../utils/playlistParser';

interface ChannelPickerProps {
  channels: PlaylistChannel[];
  onSelect: (channel: PlaylistChannel) => void;
  onClose: () => void;
}

export function ChannelPicker({ channels, onSelect, onClose }: ChannelPickerProps) {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, PlaylistChannel[]>();
    for (const ch of channels) {
      const key = ch.group || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ch);
    }
    return map;
  }, [channels]);

  const groupNames = useMemo(() => [...groups.keys()].sort(), [groups]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = selectedGroup ? (groups.get(selectedGroup) ?? channels) : channels;
    if (!q) return list;
    return list.filter((ch) => ch.name.toLowerCase().includes(q));
  }, [channels, search, selectedGroup, groups]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-discord-sidebar rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-discord-dark">
          <h2 className="text-sm font-semibold">Select a Channel</h2>
          <button onClick={onClose} className="text-discord-muted hover:text-discord-text text-lg leading-none">&times;</button>
        </div>

        <div className="px-4 py-2 border-b border-discord-dark">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search channels..."
            className="w-full bg-discord-card text-sm px-3 py-2 rounded border border-discord-hover focus:outline-none focus:border-discord-blurple placeholder:text-discord-muted"
          />
        </div>

        <div className="flex gap-1 px-4 py-2 overflow-x-auto border-b border-discord-dark">
          {selectedGroup && (
            <button
              onClick={() => setSelectedGroup(null)}
              className="shrink-0 text-xs px-2 py-1 rounded bg-discord-blurple text-white font-medium"
            >
              All
            </button>
          )}
          {groupNames.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g === selectedGroup ? null : g)}
              className={`shrink-0 text-xs px-2 py-1 rounded font-medium ${
                g === selectedGroup
                  ? 'bg-discord-blurple text-white'
                  : 'bg-discord-card text-discord-muted hover:text-discord-text'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-discord-muted text-sm py-8">No channels found</p>
          ) : (
            filtered.map((ch, i) => (
              <button
                key={`${ch.url}-${i}`}
                onClick={() => onSelect(ch)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-discord-hover transition-colors text-left border-b border-discord-dark/50 last:border-0"
              >
                {ch.logo ? (
                  <img
                    src={ch.logo}
                    alt=""
                    className="w-10 h-10 rounded object-contain bg-black/40 shrink-0"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-discord-card flex items-center justify-center text-sm font-bold text-discord-muted shrink-0">
                    {ch.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{ch.name}</p>
                  {ch.group && <p className="text-xs text-discord-muted truncate">{ch.group}</p>}
                </div>
                <span className="text-xs text-discord-green shrink-0">Select</span>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-discord-dark text-xs text-discord-muted text-center">
          {channels.length} channels
        </div>
      </div>
    </div>
  );
}
