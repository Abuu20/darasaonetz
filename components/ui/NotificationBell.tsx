import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, BellOff, X, CheckCheck, UserPlus, BookOpen, CheckCircle2, XCircle, ClipboardCheck, Star, Megaphone, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { notificationQueries } from "@/lib/db/notifications";
import type { AppNotification, NotificationType } from "@/lib/db/types";

const LIMIT = 30;
// Below this width the panel becomes a full-screen sheet instead of a
// dropdown — matches the breakpoint big learning apps (Coursera, Udemy)
// switch from a popover bell to a dedicated notifications screen at.
const MOBILE_QUERY = "(max-width: 639px)";

// Every notification type gets its own icon + color, the same way
// Slack/GitHub differentiate notification kinds at a glance instead of
// making someone read the title to know what happened.
const TYPE_ICON: Record<NotificationType, { icon: typeof Bell; className: string }> = {
  enrollment: { icon: UserPlus, className: "bg-primary/10 text-primary" },
  new_lesson: { icon: BookOpen, className: "bg-accent/10 text-accent" },
  course_approved: { icon: CheckCircle2, className: "bg-success/10 text-success" },
  course_rejected: { icon: XCircle, className: "bg-danger/10 text-danger" },
  quiz_result: { icon: ClipboardCheck, className: "bg-primary/10 text-primary" },
  new_review: { icon: Star, className: "bg-ember/10 text-ember" },
  announcement: { icon: Megaphone, className: "bg-accent/10 text-accent" },
  system: { icon: Info, className: "bg-slate/10 text-slate" },
};

function typeMeta(type: string) {
  return TYPE_ICON[type as NotificationType] ?? { icon: Bell, className: "bg-slate/10 text-slate" };
}

function timeAgo(iso: string, locale: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return rtf.format(0, "minute");
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 7) return rtf.format(-days, "day");
  return rtf.format(-Math.round(days / 7), "week");
}

// Tracks whether we're currently below the mobile breakpoint so the panel
// can switch between a bottom sheet and a dropdown without a page reload.
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

export default function NotificationBell({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [justArrived, setJustArrived] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([notificationQueries.getForUser(user.id, LIMIT), notificationQueries.getUnreadCount(user.id)])
      .then(([list, count]) => {
        setItems(list);
        setUnread(count);
      })
      .catch(() => {
        setItems([]);
        setUnread(0);
      })
      .finally(() => setLoading(false));

    const unsubscribe = notificationQueries.subscribe(user.id, n => {
      setItems(prev => [n, ...prev].slice(0, LIMIT));
      setUnread(prev => prev + 1);
      // Brief pulse on the bell so a live arrival is felt, not just counted —
      // the same "something just happened" cue Slack/Gmail give their icon.
      setJustArrived(true);
      window.setTimeout(() => setJustArrived(false), 1600);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // A full-screen sheet has its own scroll; keep the page underneath from
  // scrolling with it on mobile, the way a native app screen would.
  useEffect(() => {
    if (!(open && isMobile)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  if (!user) return null;

  const openItem = async (item: AppNotification) => {
    setOpen(false);
    if (!item.is_read) {
      setUnread(prev => Math.max(0, prev - 1));
      setItems(prev => prev.map(x => (x.id === item.id ? { ...x, is_read: true } : x)));
      notificationQueries.markAsRead(item.id).catch(() => {});
    }
    const courseId = (item.data as { course_id?: string } | null)?.course_id;
    if (courseId) navigate(`/courses/${courseId}`);
  };

  const markAllRead = async () => {
    setUnread(0);
    setItems(prev => prev.map(x => ({ ...x, is_read: true })));
    await notificationQueries.markAllAsRead(user.id).catch(() => {});
  };

  const dismiss = async (event: React.MouseEvent, item: AppNotification) => {
    event.stopPropagation();
    setItems(prev => prev.filter(x => x.id !== item.id));
    if (!item.is_read) setUnread(prev => Math.max(0, prev - 1));
    await notificationQueries.delete(item.id).catch(() => {});
  };

  const iconTone = tone === "dark" ? "text-lilac hover:text-night-foreground" : "text-ink hover:bg-mist";
  const unreadItems = items.filter(i => !i.is_read);
  const readItems = items.filter(i => i.is_read);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={t("components.ui.NotificationBell.label")}
        animate={justArrived ? { rotate: [0, -12, 10, -6, 0] } : {}}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className={`relative flex h-10 w-10 items-center justify-center rounded-control transition-colors duration-base ${iconTone}`}
      >
        <Bell size={20} />
        <AnimatePresence>
          {unread > 0 ? (
            <motion.span
              key={unread}
              initial={{ scale: 0.4, opacity: 0.001 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0.001 }}
              className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-danger px-1 text-[10px] font-medium text-white"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <>
            {isMobile ? (
              <motion.div
                key="backdrop"
                initial={{ opacity: 0.001 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.001 }}
                transition={{ duration: 0.18 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-40 bg-ink/40"
              />
            ) : null}

            <motion.div
              key="panel"
              initial={isMobile ? { opacity: 1, y: "100%" } : { opacity: 0.001, y: -8, scale: 0.98 }}
              animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
              exit={isMobile ? { opacity: 1, y: "100%" } : { opacity: 0.001, y: -8, scale: 0.98 }}
              transition={
                isMobile ? { duration: 0.28, ease: [0.22, 1, 0.36, 1] } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
              }
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-t-panel border-t border-line bg-background shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:bottom-auto sm:top-full sm:mt-2 sm:max-h-none sm:w-80 sm:max-w-[90vw] sm:origin-top-right sm:rounded-panel sm:border sm:border-line"
            >
              {isMobile ? (
                <div className="flex justify-center pt-2" aria-hidden="true">
                  <div className="h-1 w-10 rounded-pill bg-line" />
                </div>
              ) : null}

              <div className="flex items-center justify-between border-b border-line px-stack py-tight">
                <span className="text-sm font-medium text-ink" data-text-id="components.ui.NotificationBell.title">
                  {t("components.ui.NotificationBell.title")}
                </span>
                <div className="flex items-center gap-stack">
                  {unread > 0 ? (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="inline-flex items-center gap-1 text-xs text-slate transition-colors duration-base hover:text-accent"
                    >
                      <CheckCheck size={13} aria-hidden="true" />
                      <span data-text-id="components.ui.NotificationBell.markAllRead">
                        {t("components.ui.NotificationBell.markAllRead")}
                      </span>
                    </button>
                  ) : null}
                  {isMobile ? (
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label={t("components.ui.NotificationBell.close")}
                      className="rounded-control p-1 text-slate hover:bg-mist hover:text-ink"
                    >
                      <X size={16} />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto sm:max-h-96 sm:flex-none">
                {loading ? (
                  <div className="flex flex-col gap-1 p-tight">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="h-14 animate-pulse rounded-control bg-mist" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center gap-1 px-stack py-block text-center">
                    <BellOff size={22} className="text-slate" aria-hidden="true" />
                    <p className="text-sm text-slate" data-text-id="components.ui.NotificationBell.empty">
                      {t("components.ui.NotificationBell.empty")}
                    </p>
                  </div>
                ) : (
                  <>
                    {unreadItems.length > 0 ? (
                      <NotificationGroup
                        label={t("components.ui.NotificationBell.new")}
                        items={unreadItems}
                        onOpen={openItem}
                        onDismiss={dismiss}
                        language={language}
                        isMobile={isMobile}
                      />
                    ) : null}
                    {readItems.length > 0 ? (
                      <NotificationGroup
                        label={t("components.ui.NotificationBell.earlier")}
                        items={readItems}
                        onOpen={openItem}
                        onDismiss={dismiss}
                        language={language}
                        isMobile={isMobile}
                      />
                    ) : null}
                  </>
                )}
              </div>
              {isMobile ? <div className="pb-[env(safe-area-inset-bottom)]" /> : null}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function NotificationGroup({
  label,
  items,
  onOpen,
  onDismiss,
  language,
  isMobile,
}: {
  label: string;
  items: AppNotification[];
  onOpen: (item: AppNotification) => void;
  onDismiss: (event: React.MouseEvent, item: AppNotification) => void;
  language: string;
  isMobile: boolean;
}) {
  return (
    <div>
      <div className="sticky top-0 bg-background px-stack pt-tight text-[11px] font-medium uppercase tracking-widest text-slate">
        {label}
      </div>
      {items.map(item => {
        const { icon: Icon, className } = typeMeta(item.type);
        return (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(item)}
            onKeyDown={event => (event.key === "Enter" || event.key === " ") && onOpen(item)}
            className={`group flex w-full items-start gap-tight border-b border-line px-stack text-left transition-colors duration-base last:border-b-0 hover:bg-mist active:bg-mist ${
              isMobile ? "py-stack" : "py-tight"
            } ${item.is_read ? "" : "bg-accent/5"}`}
          >
            <span
              className={`mt-0.5 flex shrink-0 items-center justify-center rounded-pill ${className} ${
                isMobile ? "h-10 w-10" : "h-8 w-8"
              }`}
            >
              <Icon size={isMobile ? 17 : 15} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-tight">
                <span className={`text-sm ${item.is_read ? "text-ink" : "font-medium text-ink"}`}>{item.title}</span>
                <span className="shrink-0 text-[11px] text-slate">{timeAgo(item.created_at, language)}</span>
              </div>
              {item.content ? <p className="line-clamp-2 text-xs text-slate">{item.content}</p> : null}
            </div>
            <button
              type="button"
              onClick={event => onDismiss(event, item)}
              aria-label="Dismiss"
              className={`mt-0.5 shrink-0 rounded-control p-0.5 text-slate transition-opacity duration-base hover:text-danger ${
                isMobile ? "opacity-60" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <X size={isMobile ? 16 : 14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
