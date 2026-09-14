// crypto.randomUUID() only exists in "secure contexts" (https://, or
// http://localhost). When a teacher opens the app over a plain LAN address
// (e.g. http://192.168.x.x:5173) — which is exactly how you'd test "what
// does this look like on the student's phone" on your own network —
// crypto.randomUUID is simply undefined there. Calling it then throws
// *before* the rest of the click handler runs, so buttons like "Add
// lesson" silently do nothing with no visible error. generateId() below
// falls back to crypto.getRandomValues (works in any context) and, failing
// that, a plain Math.random id, so id generation never breaks a click
// handler again.
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall through to the manual generator below.
    }
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Last-resort fallback for very old browsers with neither API. Not
  // cryptographically random, but perfectly fine as a client-side draft id.
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
