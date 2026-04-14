import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getRequest, putRequest } from "@/Apis/Api";
import { SOCKET_URL } from "@/constants/Constant";

export interface DashboardNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  target_roles: string[];
  company_code: string | null;
  sent_by: number | null;
  read_by: number[];
  meta: Record<string, unknown> | null;
  created_at: string;
  is_read: boolean;
}

interface NotificationsResponse {
  notifications: DashboardNotification[];
  unread_count: number;
}

interface UseNotificationsOptions {
  adminId: number;
  roleCode: string;
  companyCode?: string | null;
}

export function useNotifications({ adminId, roleCode, companyCode }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getRequest<NotificationsResponse>("/notifications?limit=30");
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch {
      // silently fail — notification errors shouldn't break the app
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect socket and join rooms
  useEffect(() => {
    if (!adminId || !roleCode) return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("dashboard:join", { adminId, roleCode, companyCode });
    });

    socket.on("dashboard:notification", (notification: DashboardNotification) => {
      setNotifications((prev) => [{ ...notification, is_read: false }, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [adminId, roleCode, companyCode]);

  // Initial fetch
  useEffect(() => {
    if (adminId && roleCode) {
      fetchNotifications();
    }
  }, [adminId, roleCode, fetchNotifications]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await putRequest(`/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await putRequest("/notifications/read-all", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
