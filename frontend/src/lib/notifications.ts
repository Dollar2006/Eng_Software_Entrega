import { api } from "@/lib/api";

export interface NotificationActor {
  user_id: string;
  display_name: string | null;
  avatar: string | null;
  gamertag: string | null;
}

export interface NotificationReview {
  review_id: number;
  game_id: number;
  game_name: string;
  cover_url: string | null;
}

export interface NotificationItem {
  id: number;
  type: "follow" | "review_like";
  read_at: string | null;
  created_at: string;
  actor: NotificationActor;
  review: NotificationReview | null;
}

export interface UnreadCountOut {
  unread_count: number;
}

export async function listNotifications(
  offset = 0,
  limit = 20,
  unreadOnly = false,
): Promise<NotificationItem[]> {
  const response = await api.get<NotificationItem[]>("/notifications", {
    params: { offset, limit, unread_only: unreadOnly },
  });
  return response.data;
}

export async function getUnreadCount(): Promise<number> {
  const response = await api.get<UnreadCountOut>("/notifications/unread-count");
  return response.data.unread_count;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all");
}
