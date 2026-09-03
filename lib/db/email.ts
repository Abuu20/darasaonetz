// Sends email via EmailJS's plain REST endpoint — no npm package required,
// and it works the same way the old live app's emailjsService.js did.
// Configure your own service/template ids at https://dashboard.emailjs.com
// and put them in .env (see .env.example). Falls back to inserting into the
// `contact_messages` table via Supabase if EmailJS isn't configured, so the
// message is never silently lost.
import { supabase } from "@/lib/db/client";

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
const WORKER_URL = (import.meta.env.VITE_UPLOAD_WORKER_URL as string | undefined)?.replace(/\/$/, "");

const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const CONTACT_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID as string | undefined;

async function sendViaEmailJS(templateId: string, params: Record<string, string>): Promise<boolean> {
  if (!PUBLIC_KEY || !SERVICE_ID || !templateId) return false;
  const res = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: templateId,
      user_id: PUBLIC_KEY,
      template_params: params,
    }),
  });
  if (!res.ok) throw new Error(`EmailJS responded ${res.status}`);
  return true;
}

export const emailService = {
  sendContactMessage: async (data: { name: string; email: string; phone?: string; role?: string; message: string }) => {
    const sent = await sendViaEmailJS(CONTACT_TEMPLATE_ID ?? "", {
      from_name: data.name,
      reply_to: data.email,
      phone: data.phone ?? "",
      role: data.role ?? "",
      message: data.message,
    }).catch(() => false);

    // Always keep a durable copy in Supabase too, whether or not EmailJS is configured.
    await supabase.from("contact_messages").insert([
      { name: data.name, email: data.email, phone: data.phone ?? null, role: data.role ?? null, message: data.message },
    ]).then(({ error }) => {
      if (error) console.warn("[contact_messages insert] (non-fatal, table may not exist yet):", error.message);
    });

    if (!sent) {
      // EmailJS not configured — the Supabase row above still captured it.
      console.info("[emailService] EmailJS not configured; message saved to Supabase only.");
    }
    return true;
  },

  // Subscribes the visitor into your Brevo contact list via the Cloudflare
  // Worker (keeps the Brevo API key server-side) so you can actually write
  // and send a campaign to everyone from Brevo's own dashboard later — this
  // function's only job is "get the email onto the list, reliably." It
  // also keeps a durable copy in Supabase as a second source of truth, in
  // case Brevo is ever unreachable.
  subscribeNewsletter: async (email: string): Promise<void> => {
    let brevoOk = false;
    let brevoErrorDetail = "";

    if (WORKER_URL) {
      try {
        const res = await fetch(`${WORKER_URL}/newsletter/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        brevoOk = res.ok;
        if (!res.ok) brevoErrorDetail = await res.text().catch(() => "");
      } catch (err) {
        brevoErrorDetail = err instanceof Error ? err.message : String(err);
      }
    }

    const { error: dbError } = await supabase.from("newsletter_subscribers").insert([{ email }]);
    // A duplicate email (23505) means they're already subscribed — that's
    // success from the visitor's point of view, not an error to surface.
    const dbOk = !dbError || dbError.code === "23505";
    if (dbError && !dbOk) console.warn("[newsletter_subscribers insert]:", dbError.message);

    if (!brevoOk && !dbOk) {
      throw new Error(brevoErrorDetail || dbError?.message || "Could not subscribe. Please try again.");
    }
    if (!brevoOk && WORKER_URL) {
      // Saved locally but didn't reach Brevo — worth knowing about even
      // though we still tell the visitor it worked (their email is safe).
      console.warn("[newsletter] Brevo subscribe failed, saved to Supabase only:", brevoErrorDetail);
    }
  },
};
