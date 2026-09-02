import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { notificationQueries } from "@/lib/db/notifications";
import type { AppNotification } from "@/lib/db/types";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function NotificationBell({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    let unsubscribe: (() => void) | undefined;

    notificationQueries.getForUser(user.id, 20).then(setItems).catch(() => setItems([]));
    notificationQueries.getUnreadCount(user.id).then(setUnread).catch(() => setUnread(0));

    unsubscribe = notificationQueries.subscribe(user.id, (n) => {
      setItems(prev => [n, ...prev].slice(0, 20));
      setUnread(prev => prev + 1);
    });

    return () => unsubscribe?.();
  }, [user]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) return null;

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0 && user) {
      await notificationQueries.markAllAsRead(user.id).catch(() => {});
      setUnread(0);
      setItems(prev => prev.map(item => ({ ...item, is_read: true })));
    }
  };

  const iconTone = tone === "dark" ? "text-lilac hover:text-night-foreground" : "text-ink hover:bg-mist";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={t("components.ui.NotificationBell.label")}
        className={`relative flex h-10 w-10 items-center justify-center rounded-control transition-colors duration-base ${iconTone}`}
      >
        <Bell size={20} />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-danger px-1 text-[10px] font-medium text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-panel border border-line bg-background shadow-lg">
          <div className="border-b border-line px-stack py-tight text-sm font-medium text-ink">
            {t("components.ui.NotificationBell.title")}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-stack py-block text-center text-sm text-slate">{t("components.ui.NotificationBell.empty")}</p>
            ) : (
              items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    const courseId = (item.data as { course_id?: string } | null)?.course_id;
                    if (courseId) navigate(`/courses/${courseId}`);
                  }}
                  className={`flex w-full flex-col gap-0.5 border-b border-line px-stack py-tight text-left transition-colors duration-base hover:bg-mist last:border-b-0 ${
                    item.is_read ? "" : "bg-accent/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-tight">
                    <span className="text-sm font-medium text-ink">{item.title}</span>
                    <span className="shrink-0 text-[11px] text-slate">{timeAgo(item.created_at)}</span>
                  </div>
                  {item.content ? <span className="text-xs text-slate">{item.content}</span> : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
