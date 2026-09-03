#!/usr/bin/env node
// One-time migration: downloads every image referenced in assets/images.json
// (currently all on images.remixer.ai, the AI site-builder's asset host) and
// re-uploads each one to YOUR Cloudflare R2 bucket — the same bucket the
// video-upload Worker already writes to. Then rewrites assets/images.json to
// point at your own R2 URLs. After this runs, the site no longer depends on
// images.remixer.ai at all.
//
// Run this locally (it needs real internet access), once:
//
//   npm install        # picks up @aws-sdk/client-s3, added to package.json
//   R2_ACCOUNT_ID=xxx R2_ACCESS_KEY_ID=xxx R2_SECRET_ACCESS_KEY=xxx \
//   R2_BUCKET_NAME=xxx R2_PUBLIC_BASE_URL=https://assets.yourdomain.com \
//   node scripts/migrate-images-to-r2.mjs
//
// Use the SAME R2 credentials/bucket you set as Worker secrets
// (cloudflare-worker/README.md) — no new service to sign up for. If your
// bucket doesn't have public access / a custom domain wired up yet, do that
// in the Cloudflare dashboard first (R2 → your bucket → Settings → Public
// Access), then use that URL as R2_PUBLIC_BASE_URL.
//
// Safe to re-run: it always re-downloads from the current images.json, so
// only run it once — a second run would just re-upload the R2 URLs from the
// first run right back to R2. The original remixer URLs are saved to
// assets/images.remixer-backup.json before anything is overwritten.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const REQUIRED = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_BASE_URL",
];

for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(
      `Missing ${key}. Set the same R2 credentials you used for the Cloudflare Worker (see cloudflare-worker/README.md).`
    );
    process.exit(1);
  }
}

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_BASE_URL,
} = process.env;

const PREFIX = "site-assets"; // objects land at <bucket>/site-assets/<key>.<ext>
const IMAGES_PATH = path.resolve("assets/images.json");
const BACKUP_PATH = path.resolve("assets/images.remixer-backup.json");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function extFromContentType(ct) {
  if (!ct) return "jpg";
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("svg")) return "svg";
  if (ct.includes("gif")) return "gif";
  return "jpg";
}

function slug(key) {
  return key.replace(/\./g, "-");
}

async function main() {
  const raw = await readFile(IMAGES_PATH, "utf8");
  const images = JSON.parse(raw);

  try {
    await readFile(BACKUP_PATH, "utf8");
    console.error(
      `${path.relative(process.cwd(), BACKUP_PATH)} already exists — looks like this already ran once. ` +
        `Delete that file first if you really want to re-run (see the note at the top of this script).`
    );
    process.exit(1);
  } catch {
    // doesn't exist yet — good, proceed
  }

  await writeFile(BACKUP_PATH, raw);

  const updated = {};
  const entries = Object.entries(images);
  let i = 0;

  for (const [key, url] of entries) {
    i++;
    process.stdout.write(`[${i}/${entries.length}] ${key} ... `);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download ${key} (${url}): HTTP ${res.status}`);
    }
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    const objectKey = `${PREFIX}/${slug(key)}.${extFromContentType(contentType)}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        Body: buf,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    updated[key] = `${R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${objectKey}`;
    console.log("done");
  }

  await writeFile(IMAGES_PATH, JSON.stringify(updated, null, 2) + "\n");
  console.log(`\nMigrated ${entries.length} images to your R2 bucket.`);
  console.log(
    `Original remixer.ai URLs kept at ${path.relative(process.cwd(), BACKUP_PATH)} in case you need to compare or re-run.`
  );
}

main().catch((err) => {
  console.error("\n", err);
  process.exit(1);
});
