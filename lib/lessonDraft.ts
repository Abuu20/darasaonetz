// Autosave for the lesson editor. Teachers can lose 20 minutes of typed
// lesson text to a phone locking, a tab getting reclaimed by the OS, or an
// accidental navigation — this keeps a debounced copy in localStorage so
// nothing typed is ever gone for good, and restores it the next time the
// same "new lesson" (per course) or "edit this lesson" (per lesson id)
// form is opened.
//
// Video files are intentionally NOT part of this: File objects can't be
// serialized into localStorage, so a selected video has to be re-picked
// after a real crash/reload. Everything the teacher actually *types* —
// title, body text, and already-uploaded attachment links — is covered.

const PREFIX = "darasaone-lesson-draft:";

export interface LessonDraftPayload {
  title: string;
  content: string;
  savedAt: number;
  [key: string]: unknown;
}

export function saveLessonDraft(key: string, data: { title: string; content: string; [key: string]: unknown }): void {
  try {
    const title = String(data.title ?? "");
    const content = String(data.content ?? "");
    if (!title.trim() && !content.trim()) {
      // Nothing worth keeping — avoid littering storage with empty drafts.
      clearLessonDraft(key);
      return;
    }
    localStorage.setItem(PREFIX + key, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    // Storage full, disabled, or private-browsing — autosave silently
    // stops working but nothing else in the app depends on it.
  }
}

export function loadLessonDraft<T = LessonDraftPayload>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearLessonDraft(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}
