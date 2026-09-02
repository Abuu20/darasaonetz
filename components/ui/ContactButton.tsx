import { Link } from "react-router-dom";

export default function ContactButton({
  to,
  label,
  className = "",
}: {
  to: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`gradient-brand group relative inline-flex items-center justify-center rounded-control p-px ${className}`}
    >
      <span className="rounded-[11px] bg-primary px-block py-tight text-sm text-primary-foreground transition-colors duration-base group-hover:bg-transparent">
        {label}
      </span>
    </Link>
  );
}
