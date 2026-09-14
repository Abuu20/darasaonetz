import { supabase } from "@/lib/db/client";

const WORKER_URL = (import.meta.env.VITE_UPLOAD_WORKER_URL as string | undefined)?.replace(/\/$/, "");

interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

async function requestPresignedUrl(params: {
  courseId: string;
  lessonId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}): Promise<PresignResponse> {
  if (!WORKER_URL) {
    throw new Error(
      "Video uploads aren't configured yet — set VITE_UPLOAD_WORKER_URL once the upload worker is deployed (see cloudflare-worker/README.md)."
    );
  }

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error("You must be signed in as a teacher to upload video.");

  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(params),
    });
  } catch {
    // fetch() collapses every network-layer failure (DNS, no route, a
    // blocked CORS preflight) into the same opaque "Failed to fetch"
    // TypeError. Left as-is that's what a teacher sees on the publish
    // button. The real cause is almost always: the Worker isn't deployed
    // at VITE_UPLOAD_WORKER_URL, or its ALLOWED_ORIGIN doesn't include
    // this site's exact origin.
    throw new Error(
      "Couldn't reach the video upload service. Check that the Cloudflare Worker is deployed at VITE_UPLOAD_WORKER_URL, and that its ALLOWED_ORIGIN includes this site's exact URL."
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Upload authorization failed (${res.status})`);
  }
  return res.json();
}

// PUTs the file directly to R2 using XMLHttpRequest (not fetch) specifically
// because fetch has no upload-progress event — and for a multi-hundred-MB
// video, a progress bar isn't a nicety, it's the difference between "this is
// working" and a teacher assuming the page froze and reloading mid-upload.
function putWithProgress(url: string, file: File, contentType: string, onProgress?: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = event => {
      if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload to storage failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload — check your connection and try again."));
    xhr.send(file);
  });
}

export const r2VideoStorage = {
  upload: async (
    courseId: string,
    lessonId: string,
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<string> => {
    const presigned = await requestPresignedUrl({
      courseId,
      lessonId,
      fileName: file.name,
      contentType: file.type || "video/mp4",
      fileSize: file.size,
    });
    onProgress?.(1); // signal "starting" immediately — presign round-trip already took a moment
    await putWithProgress(presigned.uploadUrl, file, file.type || "video/mp4", onProgress);
    return presigned.publicUrl;
  },

  isConfigured: () => Boolean(WORKER_URL),
};
