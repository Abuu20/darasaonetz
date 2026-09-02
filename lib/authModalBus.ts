export type AuthModalRequest = {
  mode?: "signin" | "signup";
  role?: "student" | "teacher";
};

const EVENT_NAME = "darasaone:open-auth";

export function openAuthModal(request: AuthModalRequest = {}) {
  window.dispatchEvent(new CustomEvent<AuthModalRequest>(EVENT_NAME, { detail: request }));
}

export function onOpenAuthModal(handler: (request: AuthModalRequest) => void): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<AuthModalRequest>).detail ?? {});
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
