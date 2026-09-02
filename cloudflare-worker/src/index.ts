// darasaone-upload-worker
//
// Generates short-lived, presigned PUT URLs so the browser can upload lesson
// videos directly to R2 — without ever holding R2 credentials itself. This
// is the standard secure pattern for large-file uploads: the browser talks
// straight to object storage, this Worker's only job is to say "yes, this
// signed-in teacher is allowed to upload this one file, here's a URL good
// for 10 minutes."
//
// No external dependencies (no aws4fetch, no AWS SDK) — the AWS SigV4
// presigned-URL algorithm is implemented directly with the Web Crypto API,
// which every Workers runtime has natively. One less thing to `npm install`,
// one less supply-chain surface.

export interface Env {
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_BASE_URL: string; // e.g. https://pub-xxxx.r2.dev or your custom domain, no trailing slash
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ALLOWED_ORIGIN: string; // e.g. https://darasaone-tz.vercel.app (comma-separate multiple)
}

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2GB safety ceiling
const URL_EXPIRY_SECONDS = 60 * 15; // 15 minutes to complete the PUT

function corsHeaders(origin: string, env: Env): HeadersInit {
  const allowed = env.ALLOWED_ORIGIN.split(",").map(o => o.trim());
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data: unknown, status: number, origin: string, env: Env): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin, env) },
  });
}

// ---- AWS SigV4 presigned URL (query-string form), implemented from spec ----

async function hmac(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey("raw", key as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
}

async function sha256Hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function amzDate(d: Date): { amzDate: string; dateStamp: string } {
  const iso = d.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
}

// Presigned PUT URL for an R2 (S3-compatible) object.
async function presignPutUrl(env: Env, objectKey: string, contentType: string): Promise<string> {
  const region = "auto";
  const service = "s3";
  const host = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const { amzDate: date, dateStamp } = amzDate(new Date());
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const credential = `${env.R2_ACCESS_KEY_ID}/${credentialScope}`;

  const canonicalUri = `/${env.R2_BUCKET_NAME}/${objectKey.split("/").map(encodeURIComponent).join("/")}`;

  const queryParams: [string, string][] = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", credential],
    ["X-Amz-Date", date],
    ["X-Amz-Expires", String(URL_EXPIRY_SECONDS)],
    ["X-Amz-SignedHeaders", "content-type;host"],
  ];
  const canonicalQueryString = queryParams
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
  const signedHeaders = "content-type;host";
  const payloadHash = "UNSIGNED-PAYLOAD"; // browser streams the PUT body directly; we don't hash it here

  const canonicalRequest = ["PUT", canonicalUri, canonicalQueryString, canonicalHeaders, signedHeaders, payloadHash].join("\n");

  const stringToSign = ["AWS4-HMAC-SHA256", date, credentialScope, await sha256Hex(canonicalRequest)].join("\n");

  const kDate = await hmac(new TextEncoder().encode("AWS4" + env.R2_SECRET_ACCESS_KEY), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, "aws4_request");
  const signature = toHex(await hmac(kSigning, stringToSign));

  return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

// ---- Auth: confirm the caller is a signed-in teacher ----

async function getAuthedTeacherId(req: Request, env: Env): Promise<{ id: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const accessToken = authHeader.slice("Bearer ".length);

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${accessToken}`, apikey: env.SUPABASE_ANON_KEY },
  });
  if (!userRes.ok) return null;
  const user = (await userRes.json()) as { id?: string };
  if (!user.id) return null;

  // Confirm role=teacher using the caller's own JWT, so this respects
  // whatever row-level security policy already governs `profiles` — no
  // service-role key needed in this Worker at all.
  const profileRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`,
    { headers: { Authorization: `Bearer ${accessToken}`, apikey: env.SUPABASE_ANON_KEY } }
  );
  if (!profileRes.ok) return null;
  const rows = (await profileRes.json()) as { role?: string }[];
  if (rows[0]?.role !== "teacher" && rows[0]?.role !== "admin") return null;

  return { id: user.id };
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-120);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin, env) });
    }

    if (request.method !== "POST" || new URL(request.url).pathname !== "/presign") {
      return json({ error: "Not found" }, 404, origin, env);
    }

    const teacher = await getAuthedTeacherId(request, env);
    if (!teacher) {
      return json({ error: "Unauthorized — sign in as a teacher to upload video." }, 401, origin, env);
    }

    let body: { courseId?: string; lessonId?: string; fileName?: string; contentType?: string; fileSize?: number };
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400, origin, env);
    }

    const { courseId, lessonId, fileName, contentType, fileSize } = body;
    if (!courseId || !lessonId || !fileName || !contentType) {
      return json({ error: "courseId, lessonId, fileName and contentType are required" }, 400, origin, env);
    }
    if (!contentType.startsWith("video/")) {
      return json({ error: "Only video files can be uploaded through this endpoint" }, 400, origin, env);
    }
    if (typeof fileSize === "number" && fileSize > MAX_VIDEO_BYTES) {
      return json({ error: "File is larger than the 2GB limit" }, 413, origin, env);
    }

    const objectKey = `videos/${courseId}/${lessonId}/${Date.now()}-${sanitizeFileName(fileName)}`;
    const uploadUrl = await presignPutUrl(env, objectKey, contentType);
    const publicUrl = `${env.R2_PUBLIC_BASE_URL}/${objectKey}`;

    return json({ uploadUrl, publicUrl, key: objectKey, expiresIn: URL_EXPIRY_SECONDS }, 200, origin, env);
  },
};
