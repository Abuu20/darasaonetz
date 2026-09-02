import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Mail, MailOpen, Phone } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useAuth } from "@/context/AuthContext";
import { contactMessageQueries, type ContactMessage } from "@/lib/db/contact";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
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

  const unreadCount = messages.filter(m => !m.read_at).length;

  return (
    <>
      <SEOHead titleKey="Contact messages" descriptionKey="Messages submitted through the contact form" />
      <main className="min-h-screen bg-night px-gutter py-section-spacing-mobile text-night-foreground md:px-gutter-lg md:py-section-spacing">
        <div className="mx-auto max-w-3xl">
          <div className="mb-block flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl text-night-foreground">Contact messages</h1>
              <p className="text-sm text-slate">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"} · {messages.length} total
              </p>
            </div>
          </div>

          {error ? (
            <div className="rounded-panel border border-danger bg-danger/10 px-stack py-tight text-sm text-night-foreground">{error}</div>
          ) : null}

          {loading ? (
            <div className="flex justify-center py-block">
              <div className="h-8 w-8 animate-spin rounded-pill border-4 border-hairline border-t-accent" />
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-panel border border-hairline bg-panel p-block text-center text-sm text-slate">
              No messages yet. Submissions from the Contact page will show up here.
            </div>
          ) : (
            <div className="flex flex-col gap-tight">
              {messages.map(m => {
                const isOpen = openId === m.id;
                const isUnread = !m.read_at;
                return (
                  <div
                    key={m.id}
                    className={`overflow-hidden rounded-panel border p-stack transition-colors duration-base ${
                      isUnread ? "border-accent/40 bg-panel" : "border-hairline bg-panel/60"
                    }`}
                  >
                    <button type="button" onClick={() => openMessage(m)} className="flex w-full items-start justify-between gap-stack text-left">
                      <div className="flex items-start gap-tight">
                        {isUnread ? <Mail size={16} className="mt-0.5 shrink-0 text-accent" /> : <MailOpen size={16} className="mt-0.5 shrink-0 text-slate" />}
                        <div>
                          <p className={`text-sm ${isUnread ? "font-semibold text-night-foreground" : "text-night-foreground"}`}>{m.name}</p>
                          <p className="text-xs text-slate">{m.email}</p>
                          {!isOpen ? <p className="mt-1 line-clamp-1 text-sm text-slate">{m.message}</p> : null}
                        </div>
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-xs text-slate">{formatDate(m.created_at)}</span>
                    </button>
                    {isOpen ? (
                      <div className="mt-tight space-y-1 border-t border-hairline pt-tight text-sm">
                        {m.phone ? (
                          <p className="flex items-center gap-1 text-slate">
                            <Phone size={14} /> {m.phone}
                          </p>
                        ) : null}
                        {m.role ? <p className="text-slate">Role: {m.role}</p> : null}
                        <p className="whitespace-pre-wrap pt-1 text-night-foreground">{m.message}</p>
                        <a href={`mailto:${m.email}`} className="mt-tight inline-block rounded-pill bg-accent px-block py-tight text-xs text-accent-foreground">
                          Reply by email
                        </a>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
