import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { IconBell } from "@tabler/icons-react";

import Avatar from "@/components/profile/Avatar";
import { Button } from "@/components/ui/button";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/notifications";

const POLL_MS = 45000;

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function notificationText(item: NotificationItem): string {
  const actor = item.actor.display_name?.trim() || item.actor.gamertag || "Alguém";
  if (item.type === "follow") return `${actor} começou a seguir você`;
  if (item.type === "review_like") {
    const game = item.review?.game_name ? ` de ${item.review.game_name}` : "";
    return `${actor} curtiu sua review${game}`;
  }
  return `${actor} interagiu com você`;
}

function notificationHref(item: NotificationItem): string | null {
  if (item.type === "follow") {
    return item.actor.gamertag ? `/u/${encodeURIComponent(item.actor.gamertag)}` : null;
  }
  if (item.type === "review_like" && item.review) return `/jogos/${item.review.game_id}`;
  return null;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const refreshUnread = useCallback(async () => {
    try {
      setUnread(await getUnreadCount());
    } catch {
      /* polling falhou: mantém valor anterior */
    }
  }, []);

  const loadItems = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await listNotifications(0, 15);
      setItems(data);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void refreshUnread();
    const id = window.setInterval(refreshUnread, POLL_MS);
    return () => window.clearInterval(id);
  }, [refreshUnread]);

  useEffect(() => {
    if (!open) return;
    void loadItems();
    void refreshUnread();
  }, [open, loadItems, refreshUnread]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function onItemClick(item: NotificationItem) {
    const href = notificationHref(item);
    if (!item.read_at) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n)));
      setUnread((u) => Math.max(0, u - 1));
      markNotificationRead(item.id).catch(() => void refreshUnread());
    }
    setOpen(false);
    if (href) navigate(href);
  }

  async function onMarkAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnread(0);
    try {
      await markAllNotificationsRead();
    } catch {
      void loadItems();
      void refreshUnread();
    }
  }

  const badge = unread > 99 ? "99+" : String(unread);

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        aria-label={unread > 0 ? `Notificações, ${unread} não lidas` : "Notificações"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative cursor-pointer px-2"
      >
        <IconBell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-medium leading-4 text-white">
            {badge}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificações"
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
            <p className="text-sm font-medium">Notificações</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="cursor-pointer text-xs text-neutral-600 hover:text-neutral-900 hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {status === "loading" && <p className="p-3 text-sm text-neutral-500">Carregando...</p>}
            {status === "error" && (
              <p className="p-3 text-sm text-neutral-500">Não foi possível carregar notificações.</p>
            )}
            {status === "ok" && items.length === 0 && (
              <p className="p-3 text-sm text-neutral-500">Nenhuma notificação ainda.</p>
            )}
            {status === "ok" &&
              items.map((item) => {
                const href = notificationHref(item);
                const content = (
                  <>
                    <Avatar
                      src={item.actor.avatar}
                      name={item.actor.display_name || item.actor.gamertag || "Usuário"}
                      className="size-9 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-neutral-800">{notificationText(item)}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">{timeAgo(item.created_at)}</p>
                    </div>
                    {!item.read_at && <span className="mt-1 size-2 shrink-0 rounded-full bg-blue-500" />}
                  </>
                );
                const cls =
                  "flex w-full cursor-pointer gap-3 px-3 py-2 text-left hover:bg-neutral-50 " +
                  (!item.read_at ? "bg-blue-50/40" : "");
                return href ? (
                  <button key={item.id} type="button" onClick={() => onItemClick(item)} className={cls}>
                    {content}
                  </button>
                ) : (
                  <div key={item.id} className={cls}>
                    {content}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
