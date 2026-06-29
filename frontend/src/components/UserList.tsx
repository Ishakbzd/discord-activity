import type { RoomUser } from '@shared';

interface UserListProps {
  users: RoomUser[];
  hostId: string;
  currentUserId: string;
  isHost: boolean;
  onTransferHost: (userId: string) => void;
}

export function UserList({
  users,
  hostId,
  currentUserId,
  isHost,
  onTransferHost,
}: UserListProps) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-discord-muted px-2 mb-1">
        Viewers — {users.length}
      </h3>
      <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-discord-hover group"
          >
            <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-sm font-semibold shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm truncate flex-1">
              {user.username}
              {user.id === currentUserId && (
                <span className="text-discord-muted ml-1">(you)</span>
              )}
            </span>
            {user.id === hostId && (
              <span className="text-xs text-discord-yellow font-medium">Host</span>
            )}
            {isHost && user.id !== hostId && user.id !== currentUserId && (
              <button
                onClick={() => onTransferHost(user.id)}
                className="text-xs text-discord-muted opacity-0 group-hover:opacity-100 hover:text-discord-blurple transition-opacity"
              >
                Make host
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
