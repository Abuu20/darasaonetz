import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

interface ToolCardProps {
  to: string;
  // A 3D Islamic emoji (bundled locally under /public/icons/tools — see
  // that folder's README) — replaces the old Lucide icon badge and the
  // even older hotlinked images.remixer.ai photos. Those photos never
  // reliably loaded once the site ran outside the AI page builder's own
  // preview (that host isn't ours to depend on), which is why the cards
  // used to look stuck loading forever. A locally bundled PNG has no
  // external host to go down, so there's no failure mode left to guard
  // against — no onError fallback needed here anymore.
  emoji: string;
  // One of the site's existing gradient utility classes (index.css) —
  // defaults to gradient-head. No longer paints a box behind the icon;
  // it's now just a soft, blurred glow so each tool keeps a distinct
  // splash of colour without putting the icon inside a card.
  gradientClassName?: string;
  title: string;
  description: string;
}

export default function ToolCard({ to, emoji, gradientClassName = "gradient-head", title, description }: ToolCardProps) {
  return (
    <Link to={to} className="group flex flex-col items-center gap-1 px-stack py-block text-center">
      <span className="relative flex h-28 w-28 shrink-0 items-center justify-center">
        <span
          className={`absolute h-16 w-16 rounded-full opacity-25 blur-2xl transition-opacity duration-slow group-hover:opacity-40 ${gradientClassName}`}
          aria-hidden="true"
        />
        <img
          src={emoji}
          alt=""
          aria-hidden="true"
          className="relative h-24 w-24 drop-shadow-lg transition-transform duration-slow group-hover:-translate-y-1 group-hover:scale-110"
        />
      </span>
      <h3 className="font-heading text-lg text-ink transition-colors duration-base group-hover:text-accent">{title}</h3>
      <p className="max-w-[15rem] text-sm text-slate">{description}</p>
      <span className="mt-1 inline-flex items-center gap-1 text-xs text-accent opacity-0 transition-opacity duration-base group-hover:opacity-100">
        <ArrowUpRight size={12} aria-hidden="true" />
      </span>
    </Link>
  );
}
