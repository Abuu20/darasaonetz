import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Mail, Phone, Inbox, Sparkles } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useAuth } from "@/context/AuthContext";
import { contactMessageQueries, type ContactMessage } from "@/lib/db/contact";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
}

export default function AdminMessages() {
  const { user, isLoading, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError("");
    contactMessageQueries
      .getAll()
      .then(setMessages)
      .catch(err => setError(err?.message || "Couldn't load messages."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const openMessage = (m: ContactMessage) => {
    setOpenId(current => (current === m.id ? null : m.id));
    if (!m.read_at) {
      contactMessageQueries
        .markAsRead(m.id)
        .then(() => setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, read_at: new Date().toISOString() } : x))))
        .catch(() => {
          /* non-fatal — the message still opens even if the read-marker fails to save */
        });
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-night">
        <div className="h-10 w-10 animate-spin rounded-pill border-4 border-hairline border-t-accent" />
      </main>
    );
  }

  if (!user) return <Navigate to="/account" replace />;
  if (!isAdmin) return <Navigate to="/account" replace />;

  const unread = messages.filter(m => !m.read_at);
  const read = messages.filter(m => m.read_at);

  const Row = ({ m }: { m: ContactMessage }) => {
    const isOpen = openId === m.id;
    const isUnread = !m.read_at;
    return (
      <div
        className={`overflow-hidden rounded-panel border shadow-sm transition-colors duration-base ${
          isUnread ? "border-accent/40 bg-panel" : "border-hairline bg-panel/60"
        }`}
      >
        <button type="button" onClick={() => openMessage(m)} className="flex w-full items-start gap-stack p-stack text-left">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-pill text-xs font-semibold ${
              isUnread ? "bg-accent/15 text-accent" : "bg-slate/10 text-slate"
            }`}
          >
            {isUnread ? <Mail size={15} /> : initials(m.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-tight">
              <p className={`truncate text-sm ${isUnread ? "font-semibold text-night-foreground" : "text-night-foreground"}`}>
                {m.name}
              </p>
              <span className="shrink-0 whitespace-nowrap text-xs text-slate">{formatDate(m.created_at)}</span>
            </div>
            <p className="truncate text-xs text-slate">{m.email}</p>
            {!isOpen ? <p className="mt-1 line-clamp-1 text-sm text-slate">{m.message}</p> : null}
          </div>
        </button>
        {isOpen ? (
          <div className="space-y-1 border-t border-hairline p-stack pt-tight text-sm">
            {m.phone ? (
              <p className="flex items-center gap-1 text-slate">
                <Phone size={14} /> {m.phone}
              </p>
            ) : null}
            {m.role ? <p className="text-slate">Role: {m.role}</p> : null}
            <p className="whitespace-pre-wrap pt-1 text-night-foreground">{m.message}</p>
            <a
              href={`mailto:${m.email}`}
              className="mt-tight inline-flex items-center gap-1 rounded-pill bg-accent px-block py-tight text-xs font-medium text-accent-foreground"
            >
              <Mail size={13} /> Reply by email
            </a>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <SEOHead titleKey="Contact messages" descriptionKey="Messages submitted through the contact form" />
      <main className="min-h-screen bg-night px-gutter py-section-spacing-mobile text-night-foreground md:px-gutter-lg md:py-section-spacing">
        <div className="mx-auto max-w-3xl">
          <div className="mb-block flex flex-wrap items-center justify-between gap-stack">
            <div>
              <h1 className="font-heading text-2xl text-night-foreground">Contact messages</h1>
              <p className="text-sm text-slate">Submissions from the Contact page</p>
            </div>
            <div className="flex gap-tight">
              <span className="rounded-pill border border-hairline bg-panel px-stack py-tight text-xs text-slate">
                {messages.length} total
              </span>
              <span
                className={`rounded-pill border px-stack py-tight text-xs ${
                  unread.length > 0 ? "border-accent/40 bg-accent/10 text-accent" : "border-hairline bg-panel text-slate"
                }`}
              >
                {unread.length > 0 ? `${unread.length} unread` : "All caught up"}
              </span>
            </div>
          </div>

          {error ? (
            <div className="mb-stack rounded-panel border border-danger bg-danger/10 px-stack py-tight text-sm text-night-foreground">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex justify-center py-block">
              <div className="h-8 w-8 animate-spin rounded-pill border-4 border-hairline border-t-accent" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-1 rounded-panel border border-hairline bg-panel p-block text-center text-sm text-slate">
              <Inbox size={22} />
              No messages yet. Submissions from the Contact page will show up here.
            </div>
          ) : (
            <div className="space-y-block">
              {unread.length > 0 ? (
                <div className="space-y-tight">
                  <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-widest text-slate">
                    <Sparkles size={12} /> New
                  </p>
                  <div className="flex flex-col gap-tight">
                    {unread.map(m => (
                      <Row key={m.id} m={m} />
                    ))}
                  </div>
                </div>
              ) : null}
              {read.length > 0 ? (
                <div className="space-y-tight">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-slate">Earlier</p>
                  <div className="flex flex-col gap-tight">
                    {read.map(m => (
                      <Row key={m.id} m={m} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
