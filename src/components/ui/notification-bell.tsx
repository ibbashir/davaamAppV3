import { IconBell, IconBellOff } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_COLORS: Record<string, string> = {
  topup: "bg-green-100 text-green-700",
  corporate: "bg-blue-100 text-blue-700",
  fulfillment: "bg-orange-100 text-orange-700",
  finance: "bg-purple-100 text-purple-700",
  system: "bg-gray-100 text-gray-600",
};

export function NotificationBell() {
  const { state } = useAuth();
  const user = state.user;

  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications({
      adminId: user?.id ?? 0,
      roleCode: user?.role_code ?? "",
      companyCode: null,
    });

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <IconBell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 shadow-lg"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[360px] overflow-y-auto divide-y">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <IconBellOff className="size-8 opacity-40" />
              <span className="text-sm">No notifications yet</span>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markAsRead(n.id)}
                className={`flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
                  !n.is_read ? "bg-blue-50/60" : ""
                }`}
              >
                {/* Unread dot */}
                <div className="mt-1.5 shrink-0">
                  {!n.is_read ? (
                    <span className="block h-2 w-2 rounded-full bg-blue-500" />
                  ) : (
                    <span className="block h-2 w-2 rounded-full bg-transparent" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium truncate">{n.title}</span>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        TYPE_COLORS[n.type] ?? TYPE_COLORS.system
                      }`}
                    >
                      {n.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
