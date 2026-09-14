# Darasaone upload worker

A small Cloudflare Worker with one job: check that the caller is a signed-in
teacher, then hand back a presigned URL the browser can `PUT` a video
directly to your R2 bucket with. No R2 credentials ever touch the browser or
your main app's frontend code.

## Why a Worker (not a Vercel function)

R2 is Cloudflare's own product, so a Worker in the same account can be given
zero-egress access to it, and — importantly — this Worker never actually
needs to *store* long-lived plaintext secrets it can't protect; Worker
secrets are encrypted at rest and only decrypted inside the execution
sandbox. It's also free at this volume (Cloudflare's free tier is generous)
and has no cold-start penalty worth worrying about for an endpoint that's
just doing a signing computation, not proxying the file itself.

## 1. Install Wrangler (Cloudflare's CLI) and log in

```bash
npm install -g wrangler
wrangler login
```

## 2. Get your R2 API credentials

Cloudflare dashboard → R2 → **Manage R2 API Tokens** → Create API Token.
Give it **Object Read & Write** permission, scoped to just your bucket if
possible. You'll get an Access Key ID and Secret Access Key — copy both, the
secret is shown only once.

Also note your **Account ID** (top-right of the R2 dashboard) and your
bucket's **public URL** (R2 → your bucket → Settings → Public access — either
the `pub-xxxx.r2.dev` URL after enabling public access, or your own custom
domain if you've mapped one).

## 3. Set the secrets

From inside this `cloudflare-worker/` folder:

```bash
wrangler secret put R2_ACCOUNT_ID
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put R2_BUCKET_NAME
wrangler secret put R2_PUBLIC_BASE_URL      # e.g. https://pub-xxxxxxxx.r2.dev  (no trailing slash)
wrangler secret put SUPABASE_URL            # same value as VITE_SUPABASE_URL in the main app
wrangler secret put SUPABASE_ANON_KEY       # same value as VITE_SUPABASE_ANON_KEY in the main app
wrangler secret put ALLOWED_ORIGIN          # your app's URL, e.g. https://darasaone-tz.vercel.app
```

(`wrangler secret put` prompts you to paste each value — nothing goes in a
file that could get committed to git.)

## 4. Deploy

```bash
wrangler deploy
```

This prints your Worker's URL, something like
`https://darasaone-upload-worker.<your-subdomain>.workers.dev`.

## 5. Wire it into the main app

In the main project's `.env`:

```
VITE_UPLOAD_WORKER_URL=https://darasaone-upload-worker.<your-subdomain>.workers.dev
```

That's it — `lib/db/r2.ts` in the main app calls `${VITE_UPLOAD_WORKER_URL}/presign`
to get an upload URL, then PUTs the file straight to R2.

## Make sure your R2 bucket allows public reads (for playback)

Students need to be able to *watch* the video, which means R2 → your bucket
→ Settings → **Public access** should be enabled (or fronted by your own
custom domain with a public policy). Uploads stay locked down via this
Worker either way — only reads need to be public.

## CORS on the bucket itself

The Worker handles CORS for its own `/presign` endpoint, but the actual
video `PUT` goes browser → R2 directly, so R2 also needs a CORS policy
allowing your app's origin to `PUT`. In the R2 dashboard → your bucket →
Settings → CORS Policy, add:

```json
[
  {
    "AllowedOrigins": ["https://darasaone-tz.vercel.app"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

Swap in your real deployed origin (and add `http://localhost:5173` too while
developing locally).

## Newsletter subscribe (Brevo)

This same Worker also has a `POST /newsletter/subscribe` endpoint that adds
an email to a Brevo contact list — so the newsletter form actually does
something useful, and you can later write and send a real campaign from
Brevo's own dashboard (no need to build a sender in this app).

### 1. Create a free Brevo account and a contact list

Sign up at [brevo.com](https://www.brevo.com) (free tier: 300 emails/day,
unlimited contacts). Go to **Contacts → Lists → Create a list**, name it
something like "Darasaone newsletter", and note its **List ID** (shown next
to the list name once created).

### 2. Get an API key

**Settings (top right) → SMTP & API → API Keys → Generate a new API key.**
Copy it — it's shown once.

### 3. Set the Worker secrets

```bash
wrangler secret put BREVO_API_KEY
wrangler secret put BREVO_LIST_ID
```

### 4. Deploy

```bash
wrangler deploy
```

That's it — the newsletter form on the homepage now calls
`${VITE_UPLOAD_WORKER_URL}/newsletter/subscribe`, which adds the visitor to
your Brevo list. Every subscriber is also saved to the `newsletter_subscribers`
table in Supabase as a backup.

### Sending an actual newsletter

When you're ready to send an announcement: log into Brevo → **Campaigns →
Create a campaign**, pick the list you created above, and use their
drag-and-drop editor. Brevo handles unsubscribe links, deliverability, and
open/click tracking for you — that's not something worth rebuilding inside
this app.

