// A palette from the existing design tokens (index.css) — no new colors
// introduced, so generated avatars always sit comfortably in the app's
// existing brand palette no matter which name lands on which color.
const PALETTE = ["bg-accent", "bg-ember", "bg-primary", "bg-success", "bg-danger", "bg-ink"] as const;

function initialsOf(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase() || "?";
}

// Simple deterministic hash so the same name always lands on the same
// color across renders/sessions, rather than a color that shifts every
// time (which reads as a bug, not a feature).
function colorFor(seed: string): (typeof PALETTE)[number] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

const SIZES = { sm: "h-9 w-9 text-xs", md: "h-12 w-12 text-sm", lg: "h-16 w-16 text-base" } as const;

export default function Avatar({
  name,
  src,
  size = "sm",
  className = "",
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        onError={event => {
          // If the stored photo URL breaks (deleted file, revoked share
          // link), fall back to the initials avatar rather than a broken
          // image or a generic logo — swap the whole node for the same
          // markup this component renders in the no-photo case.
          const el = event.currentTarget;
          const wrapper = document.createElement("span");
          wrapper.setAttribute("aria-hidden", "true");
          wrapper.className = `${SIZES[size]} ${colorFor(name || "?")} inline-flex shrink-0 items-center justify-center rounded-pill font-medium text-primary-foreground ${className}`;
          wrapper.textContent = initialsOf(name);
          el.replaceWith(wrapper);
        }}
        className={`${SIZES[size]} shrink-0 rounded-pill object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} ${colorFor(name || "?")} inline-flex shrink-0 items-center justify-center rounded-pill font-medium text-primary-foreground ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}
